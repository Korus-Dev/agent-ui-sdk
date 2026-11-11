import { createHarness, type Harness } from '@korus-dev/multi-agent-sdk';

type SignInHarness = Pick<Harness, 'authenticate' | 'onEvent' | 'close'>;
/** The sign-in lifecycle owns the isolated home until the browser callback settles. */
export function createCodexSignIn(home: string, openExternal: (url: string) => Promise<void>, factory: (home: string) => SignInHarness = home => createHarness('codex', { client: { name: 'agent-ui-sign-in' }, home })) {
  let active: Promise<void> | undefined;
  let cancel: (() => void) | undefined;
  return {
    login() {
      if (active) return active;
      active = (async () => {
        const harness = factory(home);
        let loginId: string | undefined;
        let off = () => {};
        try {
          const completed = new Promise<void>((resolve, reject) => {
            cancel = () => reject(new Error('Sign-in was cancelled.'));
            off = harness.onEvent(event => {
              if (event.type !== 'provider.event' || event.event.type !== 'provider.authenticationChanged' || event.event.payload.kind !== 'codex') return;
              const { connected, state } = event.event.payload;
              if (state.login.status === 'error' || state.login.status === 'cancelled') reject(new Error(state.login.error ?? 'Sign-in was cancelled.'));
              else if (connected) resolve();
            });
          });
          void completed.catch(() => {});
          const { login } = await harness.authenticate({ action: 'login', method: 'browser' });
          if (!login) throw new Error('The runtime did not start a sign-in.');
          loginId = login.id;
          if (!login.url.startsWith('https://')) throw new Error('The runtime returned an invalid sign-in URL.');
          await openExternal(login.url);
          await completed;
        } catch (error) {
          if (loginId) await harness.authenticate({ action: 'cancel', loginId }).catch(() => {});
          throw error;
        } finally { off(); cancel = undefined; await harness.close(); }
      })().finally(() => { active = undefined; });
      return active;
    },
    async close() { cancel?.(); await active?.catch(() => {}); },
  };
}
