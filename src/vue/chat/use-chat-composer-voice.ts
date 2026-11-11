import { computed, getCurrentScope, onScopeDispose, ref, type ComputedRef, type Ref } from 'vue'
import type { SpeechTranscriptionResult, ChatTranscription } from './contracts'
import {
  BrowserAudioRecorder,
  isBrowserAudioRecordingSupported,
  type RecordedAudio,
} from '../audio/browser-audio-recorder'
import { transcribeRecordedAudio } from '../audio/apple-speech-transcription'
import { useHostCapabilities } from '../native-capabilities'
import type { SpeechTranscript, StreamingTranscription } from '@korus-dev/agent-ui-sdk/host'
import { BrowserSpeechRecorder, isBrowserSpeechRecordingSupported, type SpeechRecorder } from '../audio/browser-speech-recorder'

export type ComposerVoiceOptions = {
  isDisabled: () => boolean
  isSending: () => boolean
  onTranscript: (text: string) => void | Promise<void>
  transcribeAudio?: ChatTranscription
  /** Overrides native streaming. A custom batch transcriber opts out of native streaming. */
  streamingTranscription?: StreamingTranscription
}

export type ComposerVoiceController = {
  buttonDisabled: ComputedRef<boolean>
  buttonLabel: ComputedRef<string>
  buttonTitle: ComputedRef<string>
  error: Ref<string | null>
  isRecording: Ref<boolean>
  isTranscribing: Ref<boolean>
  isStarting: Ref<boolean>
  transcript: Ref<SpeechTranscript>
  /** Normalized local microphone energy (0–1); zero for batch-only capture. */
  audioLevel: Ref<number>
  isLive: ComputedRef<boolean>
  stop: () => Promise<boolean>
  cancel: () => Promise<void>
  toggle: () => Promise<void>
  dispose: () => void
}

type ChatComposerVoiceDependencies = {
  canTranscribe: () => boolean
  createRecorder: () => BrowserAudioRecorder
  createStreamRecorder: () => SpeechRecorder
  isRecordingSupported: () => boolean
  transcribe: (recording: RecordedAudio) => Promise<SpeechTranscriptionResult>
}

export function useChatComposerVoice(
  options: ComposerVoiceOptions,
  dependencyOverrides: Partial<ChatComposerVoiceDependencies> = {},
) {
  const hostCapabilities = useHostCapabilities()
  const streaming = options.streamingTranscription ?? (options.transcribeAudio ? undefined : hostCapabilities?.streamingTranscription)
  const defaultDependencies: ChatComposerVoiceDependencies = {
    canTranscribe: () => Boolean(streaming) || hostCapabilities?.capabilities.transcription === true,
    createRecorder: () => new BrowserAudioRecorder(),
    createStreamRecorder: () => new BrowserSpeechRecorder(),
    isRecordingSupported: streaming ? isBrowserSpeechRecordingSupported : isBrowserAudioRecordingSupported,
    transcribe: (recording) => transcribeRecordedAudio(recording, {
      transcribeAppleSpeech: async (audioData, transcriptionOptions) => {
        if (!hostCapabilities) return { error: 'Speech transcription is not available.', text: '' }
        return hostCapabilities.transcribeAudio(audioData, transcriptionOptions)
      },
    }),
  }
  const providedTranscription = options.transcribeAudio
    ? {
        canTranscribe: () => true,
        transcribe: (recording: RecordedAudio) => transcribeRecordedAudio(recording, {
          transcribeAppleSpeech: options.transcribeAudio as ChatTranscription,
        }),
      }
    : {}
  const dependencies = { ...defaultDependencies, ...providedTranscription, ...dependencyOverrides }
  const isRecording = ref(false)
  const isTranscribing = ref(false)
  const isStarting = ref(false)
  const transcript = ref<SpeechTranscript>({ finalText: '', partialText: '' })
  const isLive = computed(() => Boolean(streaming))
  const audioLevel = ref(0)
  type Session = { id: string; batch?: BrowserAudioRecorder; capture?: SpeechRecorder; unsubscribe?: () => void; stopping: boolean }
  let active: Session | undefined
  const error = ref<string | null>(null)
  const recordingSupported = computed(() => dependencies.isRecordingSupported())
  const transcriptionAvailable = computed(() => dependencies.canTranscribe())
  const buttonDisabled = computed(() => (
    isStarting.value || isTranscribing.value ||
    (options.isDisabled() && !options.isSending()) ||
    !recordingSupported.value ||
    !transcriptionAvailable.value
  ))
  const buttonLabel = computed(() => isRecording.value ? 'Stop recording' : 'Record voice prompt')
  const buttonTitle = computed(() => {
    if (error.value) {
      return error.value
    }
    if (!recordingSupported.value) {
      return 'Audio recording is not available.'
    }
    if (!transcriptionAvailable.value) {
      return 'Speech transcription is not available.'
    }
    if (isTranscribing.value) {
      return 'Transcribing...'
    }
    if (isStarting.value) return 'Starting microphone...'
    return buttonLabel.value
  })

  async function toggle(): Promise<void> {
    error.value = null
    if (isRecording.value) {
      await stop()
      return
    }
    await start()
  }

  async function start(): Promise<void> {
    if (buttonDisabled.value) {
      return
    }

    const session: Session = { id: crypto.randomUUID(), stopping: false }
    active = session
    isStarting.value = true
    transcript.value = { finalText: '', partialText: '' }
    try {
      if (streaming) {
        const capture = session.capture = dependencies.createStreamRecorder()
        session.unsubscribe = streaming.onEvent((event) => {
          if (active !== session || event.sessionId !== session.id) return
          if (event.type === 'error') { fail(session, event.error); return }
          transcript.value = { finalText: event.finalText, partialText: event.partialText }
        })
        const preparation = streaming.prepare?.({ sessionId: session.id, locale: navigator.language })
        // Also observe rejection if a custom microphone adapter throws synchronously.
        void preparation?.catch(() => {})
        const microphone = capture.start(
          (audio) => streaming.append(session.id, audio),
          (error) => fail(session, errorMessage(error)),
          (level) => { if (active === session && !session.stopping) audioLevel.value = level },
        ).then(sampleRate => {
          if (active !== session) capture.release()
          return sampleRate
        })
        const [sampleRate] = await Promise.all([microphone, preparation])
        if (active !== session) { await streaming.cancel(session.id); return }
        await streaming.start({ sessionId: session.id, sampleRate, locale: navigator.language })
        if (active !== session) { await streaming.cancel(session.id); return }
        capture.activate()
      } else {
        const nextRecorder = session.batch = dependencies.createRecorder()
        await nextRecorder.start()
        if (active !== session) { nextRecorder.release(); return }
      }
      isRecording.value = true
    } catch (startError) {
      fail(session, errorMessage(startError))
    } finally { if (active === session) isStarting.value = false }
  }

  async function stop(): Promise<boolean> {
    const session = active
    if (!session || session.stopping || isStarting.value) {
      return false
    }
    session.stopping = true
    audioLevel.value = 0
    isRecording.value = false
    isTranscribing.value = true

    try {
      let result: SpeechTranscriptionResult
      if (session.capture && streaming) {
        await session.capture.stop()
        if (active !== session) return false
        result = await streaming.stop(session.id)
      } else {
        const recording = await session.batch!.stop()
        if (active !== session) return false
        result = await dependencies.transcribe(recording)
      }
      if (active !== session) return false
      if (result.error) {
        error.value = result.error
        return false
      }
      transcript.value = { finalText: result.text, partialText: '' }
      if (!result.text.trim()) return false
      await options.onTranscript(result.text)
      return active === session
    } catch (stopError) {
      if (active === session) error.value = errorMessage(stopError)
      return false
    } finally {
      session.unsubscribe?.()
      if (active === session) {
        active = undefined
        isTranscribing.value = false
        if (streaming) void streaming.cancel(session.id).catch(() => {})
      }
    }
  }

  function fail(session: Session, message: string): void {
    if (active !== session) return
    error.value = message
    void cancel()
  }

  async function cancel(): Promise<void> {
    const session = active
    active = undefined
    session?.unsubscribe?.()
    session?.batch?.release()
    session?.capture?.release()
    isRecording.value = false
    isTranscribing.value = false
    isStarting.value = false
    audioLevel.value = 0
    transcript.value = { finalText: '', partialText: '' }
    if (session && streaming) await streaming.cancel(session.id).catch(() => {})
  }

  function dispose(): void { void cancel() }

  if (getCurrentScope()) {
    onScopeDispose(dispose)
  }

  return {
    buttonDisabled,
    buttonLabel,
    buttonTitle,
    error,
    isRecording,
    isTranscribing,
    isStarting,
    transcript,
    audioLevel,
    isLive,
    stop,
    cancel,
    toggle,
    dispose,
  }
}

/**
 * Public voice controller for composing live dictation or batch voice input
 * without depending on the full Composer component.
 */
export function useComposerVoice(
  options: ComposerVoiceOptions,
): ComposerVoiceController {
  return useChatComposerVoice(options)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
