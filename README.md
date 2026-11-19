# Remso Media — Influencer Marketing Agency website

React (Vite) + Node/Express. Animated 3D hero (three.js), interactive India map, case studies,
creator wall, smart chat assistant (1,500+ question phrasings) and an admin panel to edit everything without code.

## Run locally
```bash
npm run install:all          # installs root + client
npm install --prefix server  # installs server
npm run dev                  # site: http://localhost:5173  ·  API: http://localhost:5000
```

## Production
```bash
npm run build
ADMIN_PASSWORD=your-strong-password npm start   # serves everything on http://localhost:5000
```

## Edit content (no code)
Open `/admin` and sign in with `ADMIN_PASSWORD` (the default `remso@2026` is for local use only —
**always set your own before deploying**). Edit text, numbers, brands, creators, case studies, contact
details and images, then **Save changes**. Enquiries from the contact form and chat bot appear under **Enquiries**.

## Data
- `server/defaultContent.js` — default site content (copied to `server/data/content.json` on first run)
- `server/data/leads.json` — visitor enquiries (private, git-ignored)
- `server/uploads/` — images uploaded from the admin (git-ignored)

## Deploy on Vercel (frontend + backend)
1. Import the repo. **Root Directory: the repo root** (not `client`/`server`). **Framework Preset: Other.**
   The root `vercel.json` builds the React app and serves the Express API as one serverless function (`api/index.js`).
2. Add a database (Vercel needs one, it has no persistent disk): **Storage → Marketplace → Upstash Redis → Create**, connect it to the project.
   This adds `KV_REST_API_URL` / `KV_REST_API_TOKEN` automatically.
3. **Settings → Environment Variables:** add `ADMIN_PASSWORD` (a strong password). In production there is no default password — admin stays disabled until you set it.
4. Redeploy. Check `https://<your-site>/api/health` → `{"ok":true,"storage":"redis","admin":true}`.

Notes: image uploads from the admin need file storage, so on Vercel paste a public image URL instead.
Run tests with `npm test`.
