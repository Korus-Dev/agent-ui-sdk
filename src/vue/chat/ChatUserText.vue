<template>
  <div class="agent-ui-theme chat-user-text agent-ui-markdown">
    <p>
      <template v-for="(token, index) in tokens" :key="`${token.type}-${index}`">
        <span v-if="token.type === 'text'">{{ token.text }}</span>
        <code v-else-if="token.type === 'code'">{{ token.text }}</code>
        <a v-else-if="token.type === 'link'" class="chat-message-link" :href="token.href" target="_blank" rel="noopener noreferrer">{{ token.text }}</a>
        <br v-else-if="token.type === 'line-break'">
        <ChatMentionChip v-else-if="token.type === 'file-mention'" kind="file" :name="token.displayName" class="chat-user-text__mention chat-user-text__mention--file" :title="token.displayName" />
        <slot
          v-else-if="token.type === 'custom-mention'"
          name="mention"
          :group="token.group"
          :item="token.item"
          :token="token"
          surface="message"
        >
          <ChatMentionChip kind="plugin" :name="token.displayName" class="chat-user-text__mention chat-user-text__mention--custom" :title="token.item.description || token.displayName" />
        </slot>
        <ChatMentionChip
          v-else
          :kind="token.type === 'plugin-mention' ? 'plugin' : 'skill'"
          :name="token.displayName"
          class="chat-user-text__mention"
          :class="`chat-user-text__mention--${token.type === 'plugin-mention' ? 'plugin' : 'skill'}`"
          :title="mentionTitle(token)"
        >
          <template #icon>
            <span
              class="chat-user-text__mention-icon-frame"
              :class="{
                'chat-user-text__mention-icon-frame--has-light': mentionIcon(token, 'light'),
                'chat-user-text__mention-icon-frame--has-dark': mentionIcon(token, 'dark'),
              }"
            >
              <img
                v-if="mentionIcon(token, 'light')"
                class="chat-user-text__mention-image chat-user-text__mention-image--light"
                :src="mentionIcon(token, 'light')!"
                alt=""
                aria-hidden="true"
                decoding="async"
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="failedIconUrls.add(mentionIcon(token, 'light')!)"
              >
              <img
                v-if="mentionIcon(token, 'dark')"
                class="chat-user-text__mention-image chat-user-text__mention-image--dark"
                :src="mentionIcon(token, 'dark')!"
                alt=""
                aria-hidden="true"
                decoding="async"
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="failedIconUrls.add(mentionIcon(token, 'dark')!)"
              >
              <PlugIcon
                v-if="token.type === 'plugin-mention'"
                class="chat-user-text__mention-icon"
                aria-hidden="true"
              />
              <SparklesIcon v-else class="chat-user-text__mention-icon" aria-hidden="true" />
            </span>
          </template>
        </ChatMentionChip>
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { PromptPart, PluginSummary, SkillSummary } from '@korus-dev/multi-agent-sdk';
import { PlugIcon, SparklesIcon } from '../shared/icons/app-icons';
import ChatMentionChip from './ChatMentionChip.vue';
import { parseAuthoredUserText, type UserTextToken } from './user-text';
import type { ComposerMentionGroup } from './composer-mentions-custom';

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
const props = withDefaults(defineProps<{
  content: string;
  promptContent?: readonly PromptPart[];
  mentionGroups?: readonly ComposerMentionGroup[];
  plugins?: readonly PluginSummary[];
  skills?: readonly SkillSummary[];
}>(), {
  plugins: () => [],
  mentionGroups: () => [],
  skills: () => [],
});
// Stryker restore all

const failedIconUrls = reactive(new Set<string>());
const tokens = computed(() => parseAuthoredUserText(props.content, props.promptContent, props.plugins, props.skills, props.mentionGroups));

// Stryker disable all: Vue compiler macros cannot be wrapped in mutation activation branches.
defineSlots<{
  mention(props: {
    group: Extract<UserTextToken, { type: 'custom-mention' }>['group'];
    item: Extract<UserTextToken, { type: 'custom-mention' }>['item'];
    surface: 'message';
    token: Extract<UserTextToken, { type: 'custom-mention' }>;
  }): unknown;
}>();
// Stryker restore all

function mentionIcon(
  token: Extract<UserTextToken, { type: 'plugin-mention' | 'skill-mention' }>,
  theme: 'light' | 'dark',
): string | null {
  const value = token.type === 'plugin-mention'
    ? (theme === 'dark' && token.plugin?.iconUrlDark !== token.plugin?.iconUrl
      ? token.plugin?.iconUrlDark
      : theme === 'light' ? token.plugin?.iconUrl : undefined)
    : (theme === 'light' ? token.skill?.iconSmall : undefined);
  if (!value) return null;
  if (failedIconUrls.has(value)) return null;
  if (value.startsWith('blob:') || value.startsWith('https://')) return value;
  return /^data:image\/(?:avif|bmp|gif|jpeg|png|svg\+xml|webp|x-icon);base64,/i.test(value) ? value : null;
}

function mentionTitle(token: Extract<UserTextToken, { type: 'plugin-mention' | 'skill-mention' }>): string {
  if (token.type === 'plugin-mention') {
    return token.plugin?.shortDescription || token.displayName;
  }
  return token.skill?.shortDescription || token.skill?.description || token.displayName;
}
</script>

<style scoped>
.chat-user-text {
  white-space: normal;
  overflow-wrap: anywhere;
}

.chat-user-text__mention {
  vertical-align: -2px;
}

.chat-user-text__mention-icon-frame,
.chat-user-text__mention-icon,
.chat-user-text__mention-image {
  width: var(--icon-sm);
  height: var(--icon-sm);
  flex: 0 0 var(--icon-sm);
}

.chat-user-text__mention-icon-frame {
  position: relative;
  display: inline-flex;
}

.chat-user-text__mention-icon {
  display: block;
}

.chat-user-text__mention-icon-frame--has-light .chat-user-text__mention-icon,
.chat-user-text__mention-image--dark {
  display: none;
}

:global(.agent-ui-theme--dark) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-image--light,
:global([data-theme="dark"]) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-image--light {
  display: none;
}

:global(.agent-ui-theme--dark) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-image--dark,
:global([data-theme="dark"]) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-image--dark {
  display: block;
}

:global(.agent-ui-theme--dark) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-icon,
:global([data-theme="dark"]) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-icon {
  display: none;
}

@media (prefers-color-scheme: dark) {
  :global(.agent-ui-theme--system) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-image--light,
  :global([data-theme="system"]) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-image--light {
    display: none;
  }

  :global(.agent-ui-theme--system) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-image--dark,
  :global([data-theme="system"]) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-image--dark {
    display: block;
  }

  :global(.agent-ui-theme--system) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-icon,
  :global([data-theme="system"]) .chat-user-text__mention-icon-frame--has-dark .chat-user-text__mention-icon {
    display: none;
  }
}

.chat-user-text__mention-image {
  border-radius: 0.2em;
  object-fit: contain;
}
</style>
