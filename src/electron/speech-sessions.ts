import { startAppleSpeechSession, type AppleSpeechSession } from '@korus-dev/agent-ui-sdk/speech';
import type { SpeechSessionOptions, SpeechTranscriptionResult, SpeechPreparationOptions, SpeechSessionEvent, PreparedSpeechSession } from '@korus-dev/agent-ui-sdk/host';
import { nativeChannels as channels, speechEventChannel, type NativeRequests } from './native-renderer';
import type { IpcMainHandlers } from './typed-ipc';
import type { WebContentsDidStartNavigationEventParams } from 'electron';

export type SpeechOperation = 'start' | 'stop' | 'cancel';
export type SpeechOperationOutcome = 'succeeded' | 'failed' | 'cancelled';
export type SpeechOperationObserver = (
  operation: SpeechOperation,
) => ((outcome: SpeechOperationOutcome) => void) | void;

type Owner = {
  sender: {
    on(name: string, listener: (...args: unknown[]) => void): unknown;
    removeListener(name: string, listener: (...args: unknown[]) => void): unknown;
  };
  senderFrame: { processId: number; routingId: number; send(name: string, event: unknown): void };
};
type Entry = {
  owner: Owner;
  abort: AbortController;
  session?: Promise<AppleSpeechSession>;
  prepared?: Promise<PreparedSpeechSession>;
  stopping?: Promise<SpeechTranscriptionResult>;
  bytes: number;
  cleanup: () => void;
};
type SpeechChannels = typeof channels.prepareSpeech | typeof channels.startSpeech | typeof channels.appendSpeech | typeof channels.stopSpeech | typeof channels.cancelSpeech;

export type SpeechSessionPreparer = (
  input: SpeechPreparationOptions,
  onEvent: (event: SpeechSessionEvent) => void,
  dependencies: { signal: AbortSignal; assetsPath?: string },
) => Promise<PreparedSpeechSession>;

/** One bounded recording per renderer, owned by its invoking frame. */
export function createSpeechSessions(options: {
  maxAudioBytes: number;
  appleSpeechAssetsPath?: string;
  startSpeechSession?: typeof startAppleSpeechSession;
  prepareSpeechSession?: SpeechSessionPreparer;
  onSpeechOperation?: SpeechOperationObserver;
}): { handlers: IpcMainHandlers<Pick<NativeRequests, SpeechChannels>>; dispose(): void } {
  const sessions = new Map<string, Entry>();
  const start = options.startSpeechSession ?? startAppleSpeechSession;
  async function observe<T>(
    operation: SpeechOperation,
    execute: () => Promise<T>,
    cancelled: () => boolean = () => false,
    failed: (result: T) => boolean = () => false,
  ): Promise<T> {
    const finish = safelyObserve(() => options.onSpeechOperation?.(operation));
    const report = (outcome: SpeechOperationOutcome) => {
      if (typeof finish === 'function') safelyObserve(() => finish(outcome));
    };
    try {
      const result = await execute();
      report(cancelled() || operation === 'cancel' ? 'cancelled' : failed(result) ? 'failed' : 'succeeded');
      return result;
    } catch (error) {
      report(cancelled() ? 'cancelled' : 'failed');
      throw error;
    }
  }
  function owner(value: unknown): Owner {
    const event = value as Partial<Owner> | null;
    if (!event?.sender?.on || !event.sender.removeListener || !event.senderFrame?.send) {
      throw new Error('Speech requires an owning renderer frame.');
    }
    return event as Owner;
  }
  function get(event: unknown, id: string): Entry {
    const current = owner(event);
    const entry = sessions.get(id);
    if (!entry || entry.owner.sender !== current.sender || entry.owner.senderFrame !== current.senderFrame) {
      throw new Error('Speech session owner does not match.');
    }
    return entry;
  }
  async function cancel(id: string, entry: Entry): Promise<void> {
    if (sessions.get(id) !== entry) return;
    sessions.delete(id);
    entry.cleanup();
    entry.abort.abort();
    // Do not wait for a host factory that is still resolving credentials or ignoring abort.
    // Its eventual resources must nevertheless be cancelled exactly when they arrive.
    void entry.session?.then(session => observe('cancel', () => session.cancel())).catch(() => undefined);
    void entry.prepared?.then(prepared => prepared.cancel()).catch(() => undefined);
  }
  function create(event: unknown, input: SpeechSessionOptions | SpeechPreparationOptions, preparing: boolean): Entry {
    const current = owner(event);
    if (sessions.has(input.sessionId) || [...sessions.values()].some((entry) => entry.owner.sender === current.sender)) {
      throw new Error('A speech session is already active in this renderer.');
    }
    const id = input.sessionId;
    const abort = new AbortController();
    const teardown = () => { void cancel(id, entry); };
    const onNavigation = (details: unknown, _url: unknown, sameDocument: unknown, mainFrame: unknown, processId: unknown, routingId: unknown) => {
      const navigation = details as Partial<WebContentsDidStartNavigationEventParams>;
      const frame = navigation.frame ?? { processId, routingId };
      // Older Electron versions supply positional arguments instead of details.
      if (!(navigation.isSameDocument ?? sameDocument) && ((navigation.isMainFrame ?? mainFrame)
        || (frame.processId === current.senderFrame.processId && frame.routingId === current.senderFrame.routingId))) teardown();
    };
    const publish = (result: SpeechSessionEvent) => {
      if (sessions.get(id) !== entry) return;
      try { current.senderFrame.send(speechEventChannel, result); }
      catch { teardown(); }
      if (result.type === 'error') teardown();
    };
    const entry: Entry = {
      owner: current, abort, bytes: 0,
      // Defer startup until the entry exists, including synchronous custom adapters.
      ...(preparing ? {
        prepared: Promise.resolve().then(() => options.prepareSpeechSession!(input, publish, {
          assetsPath: options.appleSpeechAssetsPath, signal: abort.signal,
        })),
      } : {
        session: Promise.resolve().then(() => observe('start', () => start(input as SpeechSessionOptions, publish,
          { assetsPath: options.appleSpeechAssetsPath, signal: abort.signal }), () => abort.signal.aborted)),
      }),
      cleanup: () => {
        for (const name of ['destroyed', 'render-process-gone']) current.sender.removeListener(name, teardown);
        current.sender.removeListener('did-start-navigation', onNavigation);
      },
    };
    sessions.set(id, entry);
    for (const name of ['destroyed', 'render-process-gone']) current.sender.on(name, teardown);
    current.sender.on('did-start-navigation', onNavigation);
    return entry;
  }
  return {
    handlers: {
      [channels.prepareSpeech]: async (event, raw) => {
        const input = raw as SpeechPreparationOptions | null;
        if (!options.prepareSpeechSession) throw new Error('Speech preparation is not supported.');
        if (!input || typeof input.sessionId !== 'string' || !/^[\w-]{1,128}$/.test(input.sessionId)
          || (input.locale !== undefined && (typeof input.locale !== 'string' || input.locale.length > 128))) {
          throw new TypeError('Invalid speech preparation options.');
        }
        const entry = create(event, input, true);
        try { await entry.prepared; }
        catch (error) { await cancel(input.sessionId, entry); throw error; }
        if (entry.abort.signal.aborted) throw new Error('Speech recording cancelled.');
      },
      [channels.startSpeech]: async (event, raw) => {
        const input = raw as SpeechSessionOptions | null;
        if (!input || typeof input.sessionId !== 'string' || !/^[\w-]{1,128}$/.test(input.sessionId)
          || !Number.isInteger(input.sampleRate) || input.sampleRate < 8000 || input.sampleRate > 96000
          || (input.locale !== undefined && (typeof input.locale !== 'string' || input.locale.length > 128))) {
          throw new TypeError('Invalid speech session options.');
        }
        const existing = sessions.get(input.sessionId);
        const entry = existing?.prepared ? get(event, input.sessionId) : create(event, input, false);
        if (existing?.prepared) {
          if (entry.session) throw new Error('A speech session is already active in this renderer.');
          entry.session = entry.prepared!.then(prepared => {
            entry.abort.signal.throwIfAborted();
            return observe('start', () => prepared.start(input.sampleRate), () => entry.abort.signal.aborted);
          });
        }
        const id = input.sessionId;
        const abort = entry.abort;
        try { await entry.session; }
        catch (error) { await cancel(id, entry); throw error; }
        if (abort.signal.aborted) throw new Error('Speech recording cancelled.');
      },
      [channels.appendSpeech]: async (event, id, audio) => {
        const entry = get(event, id);
        if (!entry.session) throw new Error('Speech session is not active.');
        if (entry.stopping) throw new Error('Speech session is finalizing.');
        if (!(audio instanceof ArrayBuffer) || !audio.byteLength || audio.byteLength % 4 || audio.byteLength > 256 * 1024) {
          throw new TypeError('Invalid PCM audio chunk.');
        }
        entry.bytes += audio.byteLength;
        if (entry.bytes > options.maxAudioBytes) {
          await cancel(id, entry);
          throw new RangeError('Speech recording exceeds the audio byte limit.');
        }
        await (await entry.session).append(audio);
      },
      [channels.stopSpeech]: async (event, id) => {
        const entry = get(event, id);
        if (!entry.session) throw new Error('Speech session is not active.');
        entry.stopping ??= entry.session.then((session) => observe(
          'stop', () => session.stop(), () => entry.abort.signal.aborted, result => Boolean(result.error),
        )).finally(() => {
          if (sessions.get(id) === entry) sessions.delete(id);
          entry.cleanup();
        });
        return entry.stopping;
      },
      [channels.cancelSpeech]: async (event, id) => {
        // A final result/error may already have removed this session.
        if (!sessions.has(id)) return;
        await cancel(id, get(event, id));
      },
    },
    dispose: () => { for (const [id, entry] of sessions) void cancel(id, entry); },
  };
}

/** Observation is best-effort: never await it or let it change speech results. */
function safelyObserve<T>(callback: () => T): T | undefined {
  try {
    const result = callback();
    void Promise.resolve(result).catch(() => undefined);
    return result;
  } catch {
    return undefined;
  }
}
