# Harmonic Blues Fusion - Landing Page

Static site for the Harmonic Blues Fusion dance community, built with Eleventy and hosted on GitHub Pages.

## Local development

Requires Node.js 22 (see `.nvmrc`) and pnpm (`corepack enable` installs the version pinned in `package.json`).

```bash
pnpm install
docker compose up -d   # Remark42 comments on localhost:8748 (optional)
pnpm dev
```

Serves the site at [http://localhost:8747/](http://localhost:8747/) and reloads the browser when templates, markdown, CSS, or TypeScript change. On localhost, comments use Remark42 at [http://localhost:8748/](http://localhost:8748/). Stop comments with `docker compose down`.

| Command | What it does |
|---|---|
| `pnpm dev` | Eleventy dev server plus esbuild in watch mode |
| `pnpm build` | Production build into `_site/` |
| `pnpm typecheck` | Type-check templates and browser code |

### Calendar API on localhost

If upcoming events hang or fail with `403` while developing, your Google API key’s HTTP referrer restrictions likely block local origins. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), edit the key and add:

- `http://localhost:8747/*`
- `http://127.0.0.1:8747/*`

Keep your production domain referrers as well (e.g. `https://harmonicfusion.dance/*`).

## Setup

1. Create a new GitHub repository
2. Push these files to the repository
3. Go to Settings → Pages → Build and deployment → Source: **GitHub Actions**
4. After the first push to `main`, the Deploy GitHub Pages workflow builds the site and publishes `_site/`
5. Your site will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/` (or your custom domain)

The `Dockerfile` builds the same site and serves it with nginx.

## Layout

The site is built with [Eleventy](https://www.11ty.dev/). Pages and layouts are TSX components rendered to static HTML at build time; no React is shipped to the browser. Browser code is TypeScript bundled by esbuild.

- `src/*.11ty.tsx`, `src/*/index.11ty.tsx` — pages (one per URL)
- `src/_includes/components/` — shared TSX components (`Base`, `Head`, `Nav`, `Footer`, `EventModal`, `Comments`)
- `src/_includes/layouts/post.11ty.tsx` — blog post layout
- `src/_includes/site.ts` — site name, origin, analytics ID, contact email
- `src/blog/posts/*.md` — blog posts (see `AGENTS.md`)
- `src/scripts/pages/*.ts` — one browser bundle per page, written to `_site/js/`
- `src/scripts/lib/` — shared browser modules
- `src/*.css`, `src/images/`, `src/icons/` — copied to the output as-is
- `eleventy.config.js` — Eleventy config, including the `/calendar/{eventId}` dev rewrite
- `scripts/build-js.mjs` — esbuild config
- `.github/workflows/pages.yml` — builds and deploys to GitHub Pages

### Key files

- `src/index.11ty.tsx` - Main page
- `src/site.css` / `src/home.css` - Shared and home styling
- `src/scripts/pages/calendar.ts` - Calendar events loading and display
- `src/scripts/lib/config.ts` - Calendar ID, optional Google Calendar API key, and Remark42 settings
- `src/history/lineage.json` - Dance lineage data for the history page
- `src/CNAME` - Custom domain for GitHub Pages

## Google Calendar API Setup

The calendar can use either the Google Calendar API v3 (recommended) or fall back to the iCal feed. Using the API provides better performance and automatically expands recurring events.

### Getting a Google Calendar API Key

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create a New Project** (or select an existing one)
   - Click the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "Harmonic Fusion Calendar")
   - Click "Create"

3. **Enable Google Calendar API**
   - In the left sidebar, go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click on it and press "Enable"

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

5. **Restrict the API Key** (Recommended for security)
   - Click on the newly created API key to edit it
   - Under "Application restrictions", select "HTTP referrers (web sites)"
   - Add your website URL (e.g., `https://harmonicfusion.dance/*`)
   - For local testing, also add `http://localhost:8747/*` and `http://127.0.0.1:8747/*`
   - Under "API restrictions", select "Restrict key"
   - Check only "Google Calendar API"
   - Click "Save"

6. **Configure the API Key in `src/scripts/lib/config.ts`**
   - Open `src/scripts/lib/config.ts`
   - Set `googleCalendarApiKey` to your key:
     ```ts
     googleCalendarApiKey: "YOUR_API_KEY_HERE",
     ```

### Is it Safe to Use a Public API Key?

**Yes, it's safe** for public calendars because:
- The API key is restricted to only the Google Calendar API
- The calendar must be set to "Public" for the API to access it
- The key can only read public calendar data (no write access)
- You can further restrict it to only work from your specific website domain

### Benefits of Using the API

- **Automatic recurring event expansion** - No manual RRULE parsing needed
- **Better performance** - Direct API calls are faster than iCal feed parsing
- **More reliable** - No dependency on CORS proxies
- **Better error handling** - Clearer error messages if something goes wrong

### Fallback to iCal Feed

If no API key is provided (or if the API call fails), the calendar will automatically fall back to using the public iCal feed. This requires the calendar to be set to "Public" in Google Calendar settings.

### Troubleshooting 403 Forbidden Errors

If you see a `403 (Forbidden)` error when using the API, check the following:

1. **Calendar Must Be Public**
   - Go to [Google Calendar](https://calendar.google.com/)
   - Click the three dots next to your calendar → "Settings and sharing"
   - Under "Access permissions", check "Make available to public"
   - Select "See all event details" (not just "See only free/busy")

2. **Enable Billing in Google Cloud Console**
   - Even though the free tier is sufficient, Google requires billing to be enabled
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "Billing" in the left menu
   - Link a billing account (you won't be charged for basic API usage within free quotas)

3. **Verify API Key Restrictions**
   - Go to "APIs & Services" → "Credentials"
   - Click on your API key
   - Under "API restrictions", ensure "Google Calendar API" is checked
   - Under "Application restrictions", if using HTTP referrers, ensure your domain is correct
   - **Local testing**: add `http://localhost:8747/*` and `http://127.0.0.1:8747/*` (or temporarily remove referrer restrictions)

4. **Check Calendar ID Format**
   - The calendar ID in `src/scripts/lib/config.ts` should match your Google Calendar email
   - For Gmail calendars, use the full email: `yourcalendar@gmail.com`
   - For other calendar types, you may need the full calendar ID from Calendar settings

5. **Verify API is Enabled**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Ensure it shows "Enabled" (not "Enable")

If issues persist, the calendar will automatically fall back to the iCal feed method.

## Customization

Edit files under `src/` (for example `src/index.11ty.tsx` and `src/site.css`) for content and styling.
