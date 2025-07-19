# Paisley Docs

Welcome to the documentation site for **Paisley**, a financial cooperative platform for freelancers, creators, and small businesses. This site is built using [Docusaurus](https://docusaurus.io), and contains product guides, cooperative resources, token usage, and onboarding documentation.

---

## 📁 Project Structure

```
paisley-docs/
├── docs/                  # Main documentation content
│   ├── overview/          # What is Paisley, vision, etc.
│   ├── time-tokens/       # Time Token usage and creation
│   ├── wallet/            # Wallet features and payments
│   └── coop/              # Cooperative membership and governance
├── blog/                  # Blog posts and learning articles
├── static/                # Static files (e.g., logo, downloads)
├── src/                   # Custom React components and CSS
├── sidebars.js            # Sidebar structure for docs
├── docusaurus.config.ts   # Main Docusaurus site configuration
├── push.sh                # Git push helper script
├── README.md              # This file
└── ArchivedForSafety/     # Old configs and backups
```

---

## 🚀 Getting Started

To run the site locally:

```bash
npm install
npm run start
```

To build the site for production:

```bash
npm run build
npm run serve
```

To push changes (via Git):

```bash
./push.sh
```

---

## 🧠 Notes

- The site is structured with **top-level nav tabs** that each load their own **sidebar**.
- All content pages use Markdown with frontmatter to specify which sidebar they belong to.
- All Coop governance follows "1 Member = 1 Vote", and documentation reflects that principle.

---

## 🛟 Help & Contribute

- Questions? Email [support@paisley.io](mailto:support@paisley.io)
- Want to suggest edits? Fork the repo or create a PR.
- Coop members may also propose edits via the member portal.

---

Built with ♥ by the Paisley Docs Team
