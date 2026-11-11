import type { Component } from 'vue';

export type ComposerMenuItemBase<Payload = unknown> = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: Component;
  payload?: Payload;
  value?: string;
  valueAppearance?: 'plain' | 'badge';
  valueIcon?: Component;
  valueIconLabel?: string;
};

export type ComposerMenuActionItem<Payload = unknown> = ComposerMenuItemBase<Payload> & {
  type: 'action' | 'custom';
  closeOnSelect?: boolean;
  danger?: boolean;
  leadingColor?: string;
};

export type ComposerMenuCheckboxItem<Payload = unknown> = ComposerMenuItemBase<Payload> & {
  type: 'checkbox';
  accessory?: 'check' | 'switch' | Component;
  checked: boolean;
  closeOnSelect?: boolean;
};

export type ComposerMenuRadioItem<Payload = unknown> = ComposerMenuItemBase<Payload> & {
  type: 'radio';
  checked: boolean;
  closeOnSelect?: boolean;
};

export type ComposerMenuSeparatorItem = {
  id: string;
  type: 'separator';
};

export type ComposerMenuHeadingItem<Payload = unknown> = {
  id: string;
  type: 'heading';
  label: string;
  actions?: readonly ComposerMenuActionItem<Payload>[];
};

export type ComposerMenuSubmenuItem<Payload = unknown> = ComposerMenuItemBase<Payload> & {
  type: 'submenu';
  items: readonly ComposerMenuItem<Payload>[];
  /** Optional action for click/Enter; hover and ArrowRight still open the submenu. */
  selectAction?: ComposerMenuActionItem<Payload>;
  submenuAlignment?: 'top' | 'bottom';
  submenuWidth?: 'default' | 'wide';
};

export type ComposerMenuItem<Payload = unknown> =
  | ComposerMenuActionItem<Payload>
  | ComposerMenuCheckboxItem<Payload>
  | ComposerMenuHeadingItem<Payload>
  | ComposerMenuRadioItem<Payload>
  | ComposerMenuSeparatorItem
  | ComposerMenuSubmenuItem<Payload>;

export type ComposerMenuSelectableItem<Payload = unknown> = Exclude<
  ComposerMenuItem<Payload>,
  ComposerMenuHeadingItem<Payload> | ComposerMenuSeparatorItem | ComposerMenuSubmenuItem<Payload>
>;
