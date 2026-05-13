import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'AWS DOP-C02 Study Guide',
  tagline: 'DevOps Engineer Professional — Synthesis Notes',
  favicon: 'img/favicon.ico',

  future: { v4: true },

  url: 'http://localhost',
  baseUrl: '/',

  onBrokenLinks: 'warn',
  markdown: {
    format: 'detect',
  },

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: { respectPrefersColorScheme: true },
    navbar: {
      title: 'DOP-C02 Study Guide',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'studyGuide',
          position: 'left',
          label: 'Domains',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `AWS DOP-C02 Synthesis Study Guide — Built with Docusaurus`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
