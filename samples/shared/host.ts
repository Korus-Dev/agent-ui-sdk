import { randomUUID } from 'node:crypto';
import { createHarnessDriver, type HarnessDriver, type HarnessOptions, type HarnessProvider, type Session } from '@korus-dev/multi-agent-sdk';
import { toHarnessPromptOptions } from '@korus-dev/agent-ui-sdk/host.js';
import type { Commands, Conversation, Snapshot } from './contracts';

/** Trusted host owns opaque handles. Only serializable snapshots cross the bridge. */
export function createSampleHost(options: HarnessOptions, folder: string, factory = createHarnessDriver, operations?: { snapshot(): Promise<unknown>; reset(): Promise<unknown> }, resolveAttachment?: Parameters<typeof toHarnessPromptOptions>[1]) {
  const drivers = new Map<HarnessProvider, HarnessDriver>();
  const bindings = new Map<string, { driver: HarnessDriver; session: Session; view: Conversation }>();
  const listeners = new Set<(snapshot: Snapshot) => void>();
  const unsubscribers: (() => void)[] = [];
  const snapshot = (): Snapshot => structuredClone({ conversations: [...bindings.values()].map(b => b.view) });
  const publish = () => { const value = snapshot(); for (const listener of listeners) listener(value); };
  const providers = ['codex', 'claude', 'cursor', 'antigravity'];
  async function call<K extends keyof Commands>(method: K, ...args: Commands[K]): Promise<unknown> {
    if (method === 'relaySnapshot') return operations?.snapshot();
    if (method === 'relayReset') return operations?.reset();
    if (method === 'create') {
      const provider = args[0] as HarnessProvider;
      if (!providers.includes(provider)) throw new Error('Unknown harness.');
      let driver = drivers.get(provider);
      if (!driver) {
        driver = factory(provider, options); drivers.set(provider, driver);
        const owner = driver;
        unsubscribers.push(driver.onEvent(event => {
          if (event.type !== 'session.changed') return;
          const binding = [...bindings.values()].find(b => b.driver === owner && b.session === event.session);
          if (binding) { binding.view.state = event.state; binding.view.capabilities = owner.getCapabilities(event.session); publish(); }
        }));
      }
      const id = randomUUID();
      const session = driver.open({ id, folder });
      const view: Conversation = { id, provider, state: driver.readSession(session), capabilities: driver.getCapabilities(session), models: [] };
      bindings.set(id, { driver, session, view }); publish();
      // A failed catalog load must not discard a usable session.
      try { if (view.capabilities.models) view.models = await driver.listModels(session); }
      catch (error) { view.state = { ...view.state, error: error instanceof Error ? error.message : String(error) }; }
      publish(); return id;
    }
    const [id, ...values] = args;
    const binding = bindings.get(String(id));
    if (!binding) throw new Error('Conversation is not open.');
    const { driver: d, session: s } = binding;
    const typed = values as unknown[];
    switch (method) {
      case 'send': return d.sendPrompt(s, String(typed[0]), toHarnessPromptOptions(typed[1] as Commands['send'][2], resolveAttachment));
      case 'steer': return d.steerPrompt(s, String(typed[0]), toHarnessPromptOptions(typed[1] as Commands['steer'][2], resolveAttachment));
      case 'interrupt': return d.interrupt(s, d.readSession(s).activeTurnId ?? undefined);
      case 'respond': return d.respondToRequest(s, typed[0] as Commands['respond'][1]);
      case 'permission': return d.setPermission(s, String(typed[0]));
      case 'goal': return d.setGoal(s, String(typed[0]));
      case 'clearGoal': return d.clearGoal(s);
      case 'content': return d.readConversationContent(s, typed[0] as Commands['content'][1]);
      case 'history': return d.loadOlderHistory(s);
      case 'turnHistory': return d.loadTurnHistory(s, String(typed[0]));
      case 'deleteTurn': return d.deleteTurn(s, String(typed[0]));
      case 'retryTurn': return d.retryTurn(s, String(typed[0]));
      case 'editTurn': return d.editTurn(s, String(typed[0]), String(typed[1]), typed[2] as Commands['editTurn'][3]);
      case 'release': await d.release(s); bindings.delete(String(id)); publish(); return;
      default: throw new Error('Unknown sample operation.');
    }
  }
  return { snapshot, call, subscribe(listener: (value: Snapshot) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async close() { unsubscribers.forEach(off => off()); listeners.clear(); await Promise.all([...drivers.values()].map(driver => driver.close())); bindings.clear(); },
  };
}
