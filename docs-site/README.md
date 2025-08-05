# v0 MCP Server Documentation Site

This is the documentation website for the v0 MCP Server, built with Next.js and deployed on Vercel.

## Development

```bash
cd docs-site
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Deployment

This site is configured for static export and can be deployed to Vercel:

```bash
npm run build
```

The site will be exported to `docs-site/out/` and can be deployed to any static hosting service.

## Adding Documentation

1. Generated components from v0 should be placed in the `components/` directory
2. Create new pages in the `app/` directory using the Next.js App Router
3. Use the generated components to build the documentation pages

## Structure

```
docs-site/
├── app/              # Next.js App Router pages
├── components/       # React components (including v0-generated)
├── public/          # Static assets
└── lib/             # Utilities and helpers
```