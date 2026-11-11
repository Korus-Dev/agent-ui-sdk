import {
  computed,
  inject,
  provide,
  toValue,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue';

const toolCallDetailsKey: InjectionKey<MaybeRefOrGetter<boolean>> = Symbol(
  'agent-ui-sdk-tool-call-details',
);

/** Enables access to raw tool-call input and output for the current Vue subtree. */
export function provideToolCallDetails(enabled: MaybeRefOrGetter<boolean>): void {
  provide(toolCallDetailsKey, enabled);
}

/** Reads the subtree-level raw tool-call detail policy. The secure default is disabled. */
export function useToolCallDetails(): ComputedRef<boolean> {
  const enabled = inject(toolCallDetailsKey, false);
  return computed(() => Boolean(toValue(enabled)));
}
