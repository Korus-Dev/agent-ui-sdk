import {
  inject,
  provide,
  type Component,
  type InjectionKey,
} from 'vue';
import type { MessageToolCall, ToolStatusDescriptor } from './types';

export type ToolPresentationContext = {
  descriptor?: ToolStatusDescriptor;
  kind?: string;
  metadata?: Readonly<Record<string, unknown>>;
  toolCall: MessageToolCall;
};

export type ToolPresentation = {
  /** Replaces the SDK icon. Use null to render no icon. */
  icon?: Component | null;
  /** Replaces the SDK title while leaving the rest of the tool row intact. */
  title?: string;
};

export type ToolPresentationResolver = (
  context: ToolPresentationContext,
) => ToolPresentation | undefined;

const defaultToolPresentationResolver: ToolPresentationResolver = () => undefined;
const toolPresentationKey: InjectionKey<ToolPresentationResolver> = Symbol(
  'agent-ui-sdk-tool-presentation',
);

/** Configures tool icons and titles for the current Vue component tree. */
export function provideToolPresentation(resolver: ToolPresentationResolver): void {
  provide(toolPresentationKey, resolver);
}

/** Reads the nearest tool-presentation resolver, falling back to SDK presentation. */
export function useToolPresentation(): ToolPresentationResolver {
  return inject(toolPresentationKey, defaultToolPresentationResolver);
}
