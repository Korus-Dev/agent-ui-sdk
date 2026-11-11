export type ConversationVisualization = {
  readonly path: string;
  readonly title: string;
};

export type ConversationVisualizationOpenHandler = (
  visualization: ConversationVisualization,
) => void | Promise<void>;
