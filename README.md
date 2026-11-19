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
