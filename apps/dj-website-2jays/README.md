# 2JAYS — DJ website

A funky, one-page site for the DJ **2JAYS**, built to promote a serious,
bookable image and ready to show off SoundCloud mixes and TikTok clips the
moment they're ready.

## Editing the site (the only file you usually touch)

Everything you'll want to change lives in **`src/content.ts`** — your bio,
genres, booking email, social links, gigs, and the lists of SoundCloud tracks
and TikTok videos. It's heavily commented, so no coding knowledge needed.

### Adding a SoundCloud mix

1. Open your track/mix on soundcloud.com → **Share → Embed**.
2. Copy the `src="https://w.soundcloud.com/player/..."` URL.
3. Add it to the `tracks` array in `src/content.ts`.

### Adding a TikTok

1. Copy the long number at the end of the TikTok URL
   (`.../video/7412345678901234567`).
2. Add it as an `id` in the `videos` array in `src/content.ts`.

Until you add any, each section shows a tidy "coming soon" placeholder, so the
site always looks finished.

## Run it locally

```bash
pnpm install
pnpm nx dev @org/dj-website-2jays     # dev server on http://localhost:4200
pnpm nx build @org/dj-website-2jays   # production build → apps/dj-website-2jays/dist
```

## Deploy to Cloudflare Pages

It's a plain static build — perfect for Cloudflare Pages.

1. Push this repo to GitHub/GitLab and create a new **Cloudflare Pages** project
   connected to it.
2. Use these build settings:
   - **Framework preset:** `None`
   - **Build command:** `pnpm install && pnpm nx build @org/dj-website-2jays`
   - **Build output directory:** `apps/dj-website-2jays/dist`
3. Deploy. Cloudflare gives you a `*.pages.dev` URL; add your custom domain in
   the project's **Custom domains** tab.

> Prefer the CLI? After building, run
> `npx wrangler pages deploy apps/dj-website-2jays/dist`.

No server, database, or API keys required — the booking form opens the
visitor's email app pre-filled to `bookingEmail` in `src/content.ts`.
