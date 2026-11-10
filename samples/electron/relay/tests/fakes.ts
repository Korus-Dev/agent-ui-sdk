import { createRelaySeedState, relaySnapshot } from '../src/shared/relay-contracts';
export function relayOperationsSnapshot() {
  return relaySnapshot(createRelaySeedState());
}
