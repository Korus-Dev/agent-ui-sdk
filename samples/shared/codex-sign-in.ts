import { createCodexSurface, type CodexSurface } from '@korus-dev/multi-agent-sdk/codex.js';

type AuthenticationSurface = Pick<CodexSurface, 'startChatGptLogin' | 'cancelLogin' | 'onStateChange' | 'close'>;
/** The native login lifecycle owns the isolated home until the browser callback settles. */
export function createCodexSignIn(home: string, openExternal: (url: string) => Promise<void>, factory: (home: string) => AuthenticationSurface = home => createCodexSurface({ codexHome: home, autoSelectFirstConversation: false })) {
  let active: Promise<void> | undefined;
  let cancel: (() => void) | undefined;
  return {
    login() {
      if (active) return active;
      active = (async () => {
        const surface = factory(home);
        let loginId: string | undefined;
        let off = () => {};
        try {
          const completed = new Promise<void>((resolve, reject) => {
            cancel = () => reject(new Error('Sign-in was cancelled.'));
            off = surface.onStateChange(snapshot => {
              const auth = snapshot.authentication;
              if (auth.login.status === 'error' || auth.login.status === 'cancelled') reject(new Error(auth.login.error ?? 'Sign-in was cancelled.'));
              else if (auth.status === 'loaded' && (auth.account || !auth.requiresOpenaiAuth)) resolve();
            });
          });
          void completed.catch(() => {});
          const login = await surface.startChatGptLogin();
          loginId = login.loginId;
          if (!login.authUrl.startsWith('https://')) throw new Error('The runtime returned an invalid sign-in URL.');
          await openExternal(login.authUrl);
          await completed;
        } catch (error) {
          if (loginId) await surface.cancelLogin(loginId).catch(() => {});
          throw error;
        } finally { off(); cancel = undefined; await surface.close(); }
      })().finally(() => { active = undefined; });
      return active;
    },
    async close() { cancel?.(); await active?.catch(() => {}); },
  };
}
