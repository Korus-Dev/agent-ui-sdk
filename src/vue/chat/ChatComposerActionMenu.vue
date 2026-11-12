<template>
  <ComposerMenu
    v-if="menuItems.length > 0"
    class="chat-composer-action-menu__root"
    menu-class="chat-composer-action-menu"
    aria-label="Composer actions"
    button-label="Composer actions"
    :disabled="disabled"
    :items="menuItems"
    @select="selectMenuItem"
  >
    <template #trigger="{ open, toggle }">
      <button
        class="chat-composer-action-menu__button"
        type="button"
        aria-label="Composer actions"
        aria-haspopup="menu"
        :aria-expanded="open"
        :disabled="disabled"
        @click="toggle"
      >
        <PlusIcon />
      </button>
    </template>
    <template v-if="$slots.icon" #icon="scope"><slot name="icon" v-bind="scope" /></template>
    <template v-if="$slots.item" #item="scope"><slot name="item" v-bind="scope" /></template>
  </ComposerMenu>
</template>

<script setup lang="ts" generic="Payload = unknown">
import { computed } from 'vue';
import type { PermissionOption } from './contracts';
import ComposerMenu from '../components/ComposerMenu.vue';
import type {
  ComposerMenuItem,
  ComposerMenuSelectableItem,
} from '../composer-menu';
import { HandStopIcon, ListDetailsIcon, PaperclipIcon, PlusIcon, ShieldCheckIcon, TargetArrowIcon } from '../shared/icons/app-icons';

type ComposerMenuAction = { kind: 'permission'; permission: string };

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const props = withDefaults(defineProps<{
  attachEnabled?: boolean;
  disabled?: boolean;
  leadingMenuItems?: readonly ComposerMenuItem<Payload>[];
  items?: readonly ComposerMenuItem<Payload>[];
  permission?: string | null;
  permissions?: readonly PermissionOption[];
  goalMode?: boolean;
  planMode: boolean;
  showPermissionMenu?: boolean;
  showGoalMode?: boolean;
  showPlanMode?: boolean;
}>(), {
  attachEnabled: false,
  disabled: false,
  leadingMenuItems: () => [],
  items: () => [],
  permission: null,
  permissions: () => [],
  goalMode: false,
  planMode: false,
  showPermissionMenu: false,
  showGoalMode: false,
  showPlanMode: true,
});

const emit = defineEmits<{
  attach: [];
  select: [item: ComposerMenuSelectableItem<Payload>];
  selectPermission: [permission: string];
  'update:goalMode': [enabled: boolean];
  'update:planMode': [enabled: boolean];
}>();
// Stryker restore all

const menuItems = computed<ComposerMenuItem<ComposerMenuAction | Payload>[]>(() => {
  const items: ComposerMenuItem<ComposerMenuAction | Payload>[] = [];

  if (props.showPermissionMenu) {
    items.push({
      id: 'permission',
      type: 'submenu',
      label: 'Permissions',
      submenuAlignment: 'bottom',
      submenuWidth: 'wide',
      icon: ShieldCheckIcon,
      items: props.permissions.map((option) => ({
        id: `permission:${option.id}`,
        type: 'radio',
        label: option.label ?? permissionLabel(option.id),
        description: option.description ?? (option.dangerous ? 'Allows tools to run without approval.' : undefined),
        icon: option.dangerous ? ShieldCheckIcon : HandStopIcon,
        checked: option.id === props.permission,
        payload: { kind: 'permission', permission: option.id },
      })),
    });
    items.push({ id: 'group-permission', type: 'separator' });
  }

  items.push(...props.leadingMenuItems);

  if (props.showGoalMode) {
    items.push({
      id: 'goal-mode',
      type: 'checkbox',
      label: 'Goal mode',
      accessory: 'switch',
      checked: props.goalMode,
      icon: TargetArrowIcon,
    });
  }

  if (props.showPlanMode) {
    items.push({
      id: 'plan-mode',
      type: 'checkbox',
      label: 'Plan mode',
      accessory: 'switch',
      checked: props.planMode,
      icon: ListDetailsIcon,
    });
  }

  items.push(...props.items);

  if (props.attachEnabled) {
    if (items.length > 0 && items.at(-1)?.type !== 'separator') {
      items.push({ id: 'group-attach', type: 'separator' });
    }
    items.push({
      id: 'attach',
      type: 'action',
      label: 'Add Files & Photos',
      icon: PaperclipIcon,
    });
  }

  const grouped = items.filter((item, index) => item.type !== 'separator' || items[index - 1]?.type !== 'separator');
  if (grouped.at(-1)?.type === 'separator') grouped.pop();
  return grouped;
});

/** Words for a harness's permission id when the app supplies none: `acceptEdits` and `full-access` read as written. */
function permissionLabel(id: string): string {
  return id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, (char) => char.toUpperCase());
}

function selectMenuItem(item: ComposerMenuSelectableItem<ComposerMenuAction | Payload>): void {
  const action = item.payload;
  if (item.id === 'plan-mode') {
    emit('update:planMode', !props.planMode);
    return;
  }
  if (item.id === 'goal-mode') {
    emit('update:goalMode', !props.goalMode);
    return;
  }
  if (item.id.startsWith('permission:') && isComposerMenuAction(action) && action.kind === 'permission') {
    emit('selectPermission', action.permission);
    return;
  }
  if (item.id === 'attach') {
    emit('attach');
    return;
  }

  emit('select', item as ComposerMenuSelectableItem<Payload>);
}

function isComposerMenuAction(value: unknown): value is ComposerMenuAction {
  return typeof value === 'object' && value !== null && 'kind' in value;
}
</script>

<style scoped>
.chat-composer-action-menu__root {
  --agent-ui-composer-menu-radius: var(--radius-xl);
  --agent-ui-composer-menu-shadow: var(--shadow-menu);
}

.chat-composer-action-menu__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--chat-composer-action-size, 32px);
  height: var(--chat-composer-action-size, 32px);
  border: 0;
  border-radius: var(--radius-full);
  color: var(--color-text-muted);
  background: transparent;
  cursor: pointer;
}

.chat-composer-action-menu__button:hover:not(:disabled) {
  color: var(--color-text);
  background: var(--color-surface-base);
}

.chat-composer-action-menu__button:disabled {
  cursor: default;
}

.chat-composer-action-menu__button svg {
  width: var(--icon-lg);
  height: var(--icon-lg);
  stroke-width: 1.5;
}

:deep(.chat-composer-action-menu .agent-ui-composer-menu-list__submenu-list) {
  width: 360px;
  max-width: min(360px, calc(100vw - var(--space-12)));
}
</style>
