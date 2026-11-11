import { inject, type Component, type InjectionKey } from 'vue'

/** Hosts render registered assistant fences. Components receive source, language and complete props. */
export type CustomBlocks = Readonly<Record<string, Component>>
export const customBlocksKey: InjectionKey<CustomBlocks> = Symbol.for('agent-ui.custom-blocks')
export function useCustomBlocks(): CustomBlocks {
  return inject(customBlocksKey, {})
}
