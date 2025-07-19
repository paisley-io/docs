import { Config } from '@docusaurus/types';

const config: Config = {
  title: 'Paisley Documentation',
  tagline: 'A Financial System That Puts People First',
  url: 'https://docs.paisley.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',
  organizationName: 'paisley-io',
  projectName: 'docs',
  trailingSlash: false,

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.ts'),
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig: {
    navbar: {
      title: '',
      logo: {
        alt: 'Paisley Icon',
        src: 'img/PAISLEY_icon_DK_PURPLE.svg',
      },
      items: [
        {
          href: 'https://github.com/paisley-io/docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Help',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/your-link',
            },
            {
              label: 'Contact',
              href: 'mailto:support@paisley.io',
            },
          ],
        },
        {
          title: 'Legal',
          items: [
            {
              label: 'Privacy Policy',
              href: '/privacy',
            },
            {
              label: 'Terms of Use',
              href: '/terms',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Paisley Coop. All rights reserved.`,
    },
  },
};

export default config;
