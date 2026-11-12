import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Agent UI SDK',
  titleTemplate: ':title · Agent UI SDK',
  description: 'Vue conversation controls for applications powered by Codex, Claude, Cursor and Antigravity.',
  lang: 'en-US',
  base: '/agent-ui-sdk/',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://korus-dev.github.io/agent-ui-sdk/',
  },
  head: [
    ['meta', { name: 'theme-color', content: '#0b7a65' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Agent UI SDK' }],
    ['meta', {
      property: 'og:description',
      content: 'A capability-driven Vue conversation pane, composer and message controls for multi-harness agent applications.',
    }],
    ['link', { rel: 'icon', href: '/agent-ui-sdk/logo.svg', type: 'image/svg+xml' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'Agent UI SDK',
    nav: [
      { text: 'Guide', link: '/guide/' },
      {
        text: 'Build',
        items: [
          { text: 'Conversation pane', link: '/guide/conversation-pane' },
          { text: 'Composer', link: '/guide/composer' },
          { text: 'Components', link: '/guide/components' },
          { text: 'Assembling a layout', link: '/guide/assembling' },
          { text: 'Electron host', link: '/guide/electron' },
        ],
      },
      { text: 'API', link: '/api/' },
      { text: 'Samples', link: '/guide/samples' },
      { text: 'GitHub', link: 'https://github.com/Korus-Dev/agent-ui-sdk' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Getting started',
          collapsed: false,
          items: [
            { text: 'Why Agent UI SDK', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick start', link: '/guide/quick-start' },
            { text: 'Architecture', link: '/guide/architecture' },
          ],
        },
        {
          text: 'Conversation experience',
          collapsed: false,
          items: [
            { text: 'Conversation pane', link: '/guide/conversation-pane' },
            { text: 'Session binding', link: '/guide/session-binding' },
            { text: 'Components', link: '/guide/components' },
            { text: 'Assembling a custom layout', link: '/guide/assembling' },
            { text: 'Composer & input', link: '/guide/composer' },
            { text: 'Messages & tools', link: '/guide/messages-tools' },
            { text: 'Requests & approvals', link: '/guide/requests' },
            { text: 'History & performance', link: '/guide/history' },
          ],
        },
        {
          text: 'Customize and extend',
          collapsed: false,
          items: [
            { text: 'Presentation & theming', link: '/guide/presentation' },
            { text: 'Vue providers', link: '/guide/vue-providers' },
            { text: 'Documents', link: '/guide/documents' },
            { text: 'Browser panel', link: '/guide/browser' },
          ],
        },
        {
          text: 'Host integration',
          collapsed: false,
          items: [
            { text: 'Electron host', link: '/guide/electron' },
            { text: 'Native capabilities', link: '/guide/native-capabilities' },
            { text: 'Security boundary', link: '/guide/security' },
          ],
        },
        {
          text: 'Ship with confidence',
          collapsed: false,
          items: [
            { text: 'Samples', link: '/guide/samples' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' },
            { text: 'Development', link: '/guide/development' },
            { text: 'Testing', link: '/guide/testing' },
            { text: 'Releasing', link: '/guide/releasing' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API reference',
          collapsed: false,
          items: [
            { text: 'Entry points', link: '/api/' },
            { text: 'Vue components', link: '/api/vue' },
            { text: 'Session & controller', link: '/api/session' },
            { text: 'Contracts & presentation', link: '/api/contracts' },
            { text: 'Host capabilities', link: '/api/host' },
            { text: 'Electron', link: '/api/electron' },
            { text: 'Browser', link: '/api/browser' },
            { text: 'Speech', link: '/api/speech' },
            { text: 'Documents', link: '/api/documents' },
          ],
        },
      ],
    },
    search: {
      provider: 'local',
      options: {
        detailedView: true,
      },
    },
    outline: {
      level: [2, 3],
      label: 'On this page',
    },
    editLink: {
      pattern: 'https://github.com/Korus-Dev/agent-ui-sdk/edit/main/docs/:path',
      text: 'Improve this page',
    },
    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/Korus-Dev/agent-ui-sdk' },
    ],
    footer: {
      message: 'Released under the Apache License 2.0.',
      copyright: 'Copyright © 2026-present Nicolas Bonamy',
    },
  },
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
});
