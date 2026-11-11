import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, type Component, type PropType, type Slots, type VNode } from 'vue';
import type {
  ComposerMenuItem,
  ComposerMenuSelectableItem,
  ComposerMenuSubmenuItem,
} from '../composer-menu';
import { CheckIcon, ChevronRightIcon } from '../shared/icons/app-icons';

const ComposerMenuItems = defineComponent({
  name: 'ComposerMenuItems',
  props: {
    ariaLabel: {
      type: String,
      default: 'Composer actions',
    },
    items: {
      type: Array as unknown as PropType<readonly ComposerMenuItem<unknown>[]>,
      required: true,
    },
    pinnedItemCount: { type: Number, default: 0 },
  },
  emits: {
    select: (_item: ComposerMenuSelectableItem<unknown>) => true,
  },
  setup(props, { emit, slots }) {
    const openSubmenus = reactive(new Set<string>());
    const closeSubmenus = () => openSubmenus.clear();
    onMounted(() => window.addEventListener('resize', closeSubmenus));
    onBeforeUnmount(() => window.removeEventListener('resize', closeSubmenus));
    const select = (item: ComposerMenuSelectableItem<unknown>): void => {
      emit('select', item);
    };

    return (): VNode => renderMenu(props.items, props.ariaLabel, slots, select, openSubmenus, undefined, props.pinnedItemCount);
  },
});

function renderMenu(
  items: readonly ComposerMenuItem<unknown>[],
  ariaLabel: string,
  slots: Slots,
  select: (item: ComposerMenuSelectableItem<unknown>) => void,
  openSubmenus: Set<string>,
  className: string | Array<string | null> = 'agent-ui-theme agent-ui-composer-menu-list',
  pinnedItemCount = 0,
): VNode {
  const firstFocusableId = items.find((item) => item.type !== 'separator'
    && item.type !== 'heading'
    && !item.disabled
    && (item.type !== 'submenu' || item.items.length > 0))?.id;
  const content = items.map((item) => renderItem(item, slots, select, openSubmenus, item.id === firstFocusableId));
  const pinned = Math.max(0, Math.floor(pinnedItemCount));
  const children = pinned > 0 ? [
    h('div', { class: 'agent-ui-composer-menu-list__pinned', 'data-menu-section': '' }, content.slice(0, pinned)),
    h('div', { class: 'agent-ui-composer-menu-list__scroll', 'data-menu-section': '' }, content.slice(pinned)),
  ] : content;
  return h('div', {
    class: [className, pinned > 0 ? 'agent-ui-composer-menu-list--pinned' : null],
    role: 'menu',
    'aria-label': ariaLabel,
    onKeydown: (event: KeyboardEvent) => handleMenuKeydown(event, openSubmenus),
    onScroll: (event: Event) => {
      if (typeof className === 'string' && (event.target === event.currentTarget
        || (event.target instanceof HTMLElement && event.target.hasAttribute('data-menu-section')))) openSubmenus.clear();
    },
    onVnodeMounted: typeof className === 'string' ? undefined : positionScrollableSubmenu,
    onVnodeUpdated: typeof className === 'string' ? undefined : positionScrollableSubmenu,
  }, children);
}

/** Fixed flyouts escape a scrolling parent while retaining its slots, theme and focus hierarchy. */
function positionScrollableSubmenu(vnode: VNode): void {
  const menu = vnode.el;
  if (!(menu instanceof HTMLElement) || getComputedStyle(menu).display === 'none') return;
  const parent = menu.parentElement?.closest<HTMLElement>('[data-menu-section], [role="menu"]');
  if (!parent || !['auto', 'scroll'].includes(getComputedStyle(parent).overflowY)) return;
  Object.assign(menu.style, { position: '', top: '', left: '', bottom: '', right: '', maxHeight: '', overflowY: '' });
  const bounds = menu.getBoundingClientRect();
  const anchor = menu.parentElement!.getBoundingClientRect();
  const margin = 12;
  const height = Math.min(bounds.height, window.innerHeight - margin * 2);
  const left = bounds.right > window.innerWidth - margin ? anchor.left - bounds.width : bounds.left;
  Object.assign(menu.style, {
    position: 'fixed',
    left: `${Math.max(margin, Math.min(left, window.innerWidth - bounds.width - margin))}px`,
    top: `${Math.max(margin, Math.min(bounds.top, window.innerHeight - height - margin))}px`,
    right: 'auto', bottom: 'auto', maxHeight: `${window.innerHeight - margin * 2}px`, overflowY: 'auto',
  });
}

function renderItem(
  item: ComposerMenuItem<unknown>,
  slots: Slots,
  select: (item: ComposerMenuSelectableItem<unknown>) => void,
  openSubmenus: Set<string>,
  firstFocusable: boolean,
): VNode {
  if (item.type === 'separator') {
    return h('div', {
      key: item.id,
      class: 'agent-ui-composer-menu-list__separator',
      role: 'separator',
    });
  }

  if (item.type === 'heading') {
    return h('div', {
      key: item.id,
      class: 'agent-ui-composer-menu-list__heading',
      role: 'presentation',
    }, [
      h('span', { class: 'agent-ui-composer-menu-list__heading-label' }, item.label),
      item.actions?.length
        ? h('span', { class: 'agent-ui-composer-menu-list__heading-actions' }, item.actions.map((action) => (
          h('button', {
            key: action.id,
            class: 'agent-ui-composer-menu-list__heading-action',
            type: 'button',
            role: 'menuitem',
            title: action.label,
            'aria-label': action.label,
            disabled: action.disabled,
            tabindex: -1,
            onClick: () => select(action),
          }, action.icon
            ? [h(action.icon as Component, { 'aria-hidden': 'true' })]
            : action.label)
        )))
        : null,
    ]);
  }

  if (item.type === 'submenu') {
    const enabled = !item.disabled && item.items.length > 0;
    const expanded = enabled && openSubmenus.has(item.id);
    return h('div', {
      key: item.id,
      class: [
        'agent-ui-composer-menu-list__submenu',
        expanded ? 'agent-ui-composer-menu-list__submenu--open' : null,
      ],
      'data-submenu-id': item.id,
      onMouseenter: () => {
        if (enabled) openSubmenus.add(item.id);
      },
      onMouseleave: (event: MouseEvent) => {
        const submenu = (event.currentTarget as HTMLElement).querySelector(
          ':scope > .agent-ui-composer-menu-list__submenu-list',
        );
        if (!(submenu instanceof HTMLElement) || !submenu.contains(document.activeElement)) {
          openSubmenus.delete(item.id);
        }
      },
      onFocusout: (event: FocusEvent) => {
        const container = event.currentTarget as HTMLElement;
        window.setTimeout(() => {
          if (!container.contains(document.activeElement)) openSubmenus.delete(item.id);
        }, 0);
      },
    }, [
      h('button', {
        class: 'agent-ui-composer-menu-list__item agent-ui-composer-menu-list__item--submenu',
        type: 'button',
        role: 'menuitem',
        'aria-haspopup': 'menu',
        'aria-expanded': expanded,
        disabled: !enabled,
        tabindex: firstFocusable ? 0 : -1,
        onClick: () => {
          if (item.selectAction) {
            if (!item.selectAction.disabled) select(item.selectAction);
          } else {
            expanded ? openSubmenus.delete(item.id) : openSubmenus.add(item.id);
          }
        },
        onKeydown: (event: KeyboardEvent) => {
          if (event.key !== 'ArrowRight' || !enabled) return;
          const trigger = event.currentTarget as HTMLElement;
          event.preventDefault();
          event.stopPropagation();
          openSubmenus.add(item.id);
          void nextTick(() => {
            const submenu = trigger.nextElementSibling as HTMLElement | null;
            focusItem(submenu, menuItems(submenu)[0]);
          });
        },
      }, [
        ...renderContent(item, slots).nodes,
        h(ChevronRightIcon, {
          class: 'agent-ui-composer-menu-list__chevron',
          'aria-hidden': 'true',
        }),
      ]),
      enabled
        ? renderMenu(
          item.items,
          item.label,
          slots,
          (selected) => {
            if (selected.type === 'radio') openSubmenus.delete(item.id);
            select(selected);
          },
          openSubmenus,
          [
            'agent-ui-composer-menu-list agent-ui-composer-menu-list__submenu-list',
            item.submenuAlignment === 'bottom'
              ? 'agent-ui-composer-menu-list__submenu-list--bottom-aligned'
              : null,
            item.submenuWidth === 'wide' ? 'agent-ui-composer-menu-list__submenu-list--wide' : null,
          ],
        )
        : null,
    ]);
  }

  const content = renderContent(item, slots);
  return h('button', {
    key: item.id,
    class: [
      'agent-ui-composer-menu-list__item',
      item.type === 'checkbox' && item.accessory && item.accessory !== 'check'
        ? 'agent-ui-composer-menu-list__item--switch'
        : null,
      (item.type === 'action' || item.type === 'custom') && item.danger
        ? 'agent-ui-composer-menu-list__item--danger'
        : null,
    ],
    type: 'button',
    role: itemRole(item),
    'aria-checked': itemChecked(item),
    disabled: item.disabled,
    tabindex: firstFocusable ? 0 : -1,
    onClick: () => select(item),
  }, [
    ...content.nodes,
    item.type === 'checkbox' && item.accessory === 'switch'
      ? h('span', {
        class: [
          'agent-ui-composer-menu-list__switch',
          item.checked ? 'agent-ui-composer-menu-list__switch--checked' : null,
        ],
        'aria-hidden': 'true',
      }, [h('span', { class: 'agent-ui-composer-menu-list__switch-thumb' })])
      : item.type === 'checkbox' && item.accessory && typeof item.accessory !== 'string'
        ? h('span', { class: 'agent-ui-composer-menu-list__icon-toggle', 'aria-hidden': 'true' }, [h(item.accessory)])
      : item.type === 'checkbox' || (item.type === 'radio' && item.checked && !content.leadingRadioCheck)
        ? h('span', { class: 'agent-ui-composer-menu-list__selection', 'aria-hidden': 'true' }, item.checked ? '✓' : '')
      : null,
  ]);
}

function handleMenuKeydown(event: KeyboardEvent, openSubmenus: Set<string>): void {
  const menu = event.currentTarget as HTMLElement;
  const items = menuItems(menu);
  const current = event.target as HTMLButtonElement;
  const currentIndex = items.indexOf(current);
  let target: HTMLButtonElement | undefined;
  let submenuToClose: string | undefined;
  switch (event.key) {
    case 'ArrowDown': target = items[(currentIndex + 1 + items.length) % items.length]; break;
    case 'ArrowUp': target = items[(currentIndex - 1 + items.length) % items.length]; break;
    case 'Home': target = items[0]; break;
    case 'End': target = items.at(-1); break;
    case 'ArrowLeft': {
      if (!menu.classList.contains('agent-ui-composer-menu-list__submenu-list')) return;
      const container = menu.parentElement;
      const trigger = container?.querySelector(':scope > button[role="menuitem"]') as HTMLButtonElement | null;
      submenuToClose = container?.dataset.submenuId;
      target = trigger ?? undefined;
      break;
    }
    default: return;
  }
  event.preventDefault();
  event.stopPropagation();
  focusItem(menu, target);
  if (submenuToClose) openSubmenus.delete(submenuToClose);
}

function menuItems(menu: HTMLElement | null): HTMLButtonElement[] {
  if (!menu) return [];
  const items: HTMLButtonElement[] = [];
  for (const child of menu.children) {
    if (child.hasAttribute('data-menu-section')) {
      items.push(...menuItems(child as HTMLElement));
      continue;
    }
    const candidates = child.matches('button[role^="menuitem"]')
      ? [child]
      : child.querySelectorAll(
        ':scope > button[role^="menuitem"], :scope > .agent-ui-composer-menu-list__heading-actions > button[role^="menuitem"]',
      );
    for (const candidate of candidates) {
      if (candidate instanceof HTMLButtonElement && !candidate.disabled) items.push(candidate);
    }
  }
  return items;
}

function focusItem(menu: HTMLElement | null, target: HTMLButtonElement | undefined): void {
  if (!target) return;
  for (const item of menuItems(menu)) item.tabIndex = item === target ? 0 : -1;
  target.focus();
}

function renderContent(
  item: ComposerMenuSelectableItem<unknown> | ComposerMenuSubmenuItem<unknown>,
  slots: Slots,
): { nodes: Array<VNode | null>; leadingRadioCheck: boolean } {
  const customContent = slots.item?.({ item });
  if (customContent?.length) {
    return { nodes: customContent, leadingRadioCheck: false };
  }

  const customIcon = slots.icon?.({ item });
  const leadingRadioCheck = item.type === 'radio' && item.checked && !customIcon?.length;
  let icon: VNode[];
  if (customIcon?.length) {
    icon = customIcon;
  } else if (leadingRadioCheck) {
    icon = [h(CheckIcon, {
      class: 'agent-ui-composer-menu-list__icon agent-ui-composer-menu-list__radio-check',
      'aria-hidden': 'true',
    })];
  } else if ('leadingColor' in item && item.leadingColor) {
    icon = [h('span', {
      class: 'agent-ui-composer-menu-list__color-dot',
      style: { backgroundColor: item.leadingColor },
      'aria-hidden': 'true',
    })];
  } else if (item.icon) {
    icon = [h(item.icon as Component, { class: 'agent-ui-composer-menu-list__icon', 'aria-hidden': 'true' })];
  } else {
    icon = [h('span', {
      class: 'agent-ui-composer-menu-list__icon agent-ui-composer-menu-list__icon--empty',
      'aria-hidden': 'true',
    })];
  }

  return {
    nodes: [
      ...icon,
      h('span', { class: 'agent-ui-composer-menu-list__copy' }, [
        h('span', { class: 'agent-ui-composer-menu-list__label' }, item.label),
        item.description
          ? h('span', { class: 'agent-ui-composer-menu-list__description' }, ` • ${item.description}`)
          : null,
      ]),
      item.value || item.valueIcon
        ? h('span', { class: 'agent-ui-composer-menu-list__value' }, [
          item.value
            ? h('span', {
              class: item.valueAppearance === 'badge'
                ? 'agent-ui-composer-menu-list__value-badge'
                : undefined,
            }, item.value)
            : null,
          item.valueIcon
            ? h(item.valueIcon as Component, {
              class: 'agent-ui-composer-menu-list__value-icon',
              title: item.valueIconLabel,
              'aria-label': item.valueIconLabel,
              'aria-hidden': item.valueIconLabel ? undefined : 'true',
            })
            : null,
        ])
        : null,
    ],
    leadingRadioCheck,
  };
}

function itemRole(item: ComposerMenuSelectableItem<unknown>): 'menuitem' | 'menuitemcheckbox' | 'menuitemradio' {
  if (item.type === 'checkbox') {
    return 'menuitemcheckbox';
  }
  if (item.type === 'radio') {
    return 'menuitemradio';
  }
  return 'menuitem';
}

function itemChecked(item: ComposerMenuSelectableItem<unknown>): boolean | undefined {
  return item.type === 'checkbox' || item.type === 'radio' ? item.checked : undefined;
}

export default ComposerMenuItems;
