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
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: require.resolve('./sidebars.js'),
        },
        blog: {
          showReadingTime: true,
          routeBasePath: 'blog',
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
        { to: '/docs/overview', label: 'Overview', position: 'left' },
        { to: '/docs/time-tokens', label: 'Time Tokens', position: 'left' },
        { to: '/docs/wallet', label: 'Wallet & Payments', position: 'left' },
        { to: '/docs/coop', label: 'Coop Membership', position: 'left' },
        { to: '/blog', label: 'Learn', position: 'left' },
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
              to: '/docs/privacy',
            },
            {
              label: 'Terms of Use',
              to: '/docs/terms',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Paisley Coop. All rights reserved.`,
    },
  },
};

export default config;
