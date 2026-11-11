// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils';
import { shallowRef } from 'vue';
import type { SessionState } from '@korus-dev/multi-agent-sdk';
import { expect, it, vi } from 'vitest';
import { ConversationPane, createSessionConversationController } from '../../src/vue';
import { sessionFixture, capabilitiesFixture } from '../fixtures/consumer-session';

type MenuItem = { id: string; label?: string; description?: string; items?: MenuItem[] };

async function permissionItems(presentPermission?: (permission: { id: string; dangerous?: boolean }) => { label?: string; description?: string } | undefined) {
  const state = shallowRef<SessionState>({ ...sessionFixture, busy: false, activeTurnId: null, requests: [] });
  const binding = createSessionConversationController({
    conversationKey: 'permissions', state, client: { sendPrompt: vi.fn(async () => {}), setPermission: vi.fn(async () => {}) },
    capabilities: { ...capabilitiesFixture, permissions: [{ id: 'acceptEdits' }, { id: 'ask-for-approval' }, { id: 'full-access', dangerous: true }] },
    ...(presentPermission ? { presentPermission } : {}),
  });
  const pane = mount(ConversationPane, { props: { controller: binding.controller } });
  try {
    await flushPromises();
    const items = pane.findComponent({ name: 'Composer' }).props('leadingMenuItems') as MenuItem[];
    return items.find(item => item.id === 'session-permissions')!.items!.map(item => ({ label: item.label, description: item.description }));
  } finally { binding.dispose(); pane.unmount(); }
}

it('presents permission ids with the app-supplied labels', async () => {
  const items = await permissionItems(({ id }) => ({ label: `App ${id}`, description: `About ${id}` }));
  expect(items).toEqual([
    { label: 'App acceptEdits', description: 'About acceptEdits' },
    { label: 'App ask-for-approval', description: 'About ask-for-approval' },
    { label: 'App full-access', description: 'About full-access' },
  ]);
});

it('without app presentation shows only neutral wording derived from the id, with no provider-specific copy', async () => {
  const items = await permissionItems();
  expect(items.map(item => item.label)).toEqual(['Accept Edits', 'Ask for approval', 'Full access']);
  expect(items.map(item => item.description)).toEqual([undefined, undefined, 'Allows tools to run without approval.']);
});
