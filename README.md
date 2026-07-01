# Soul & Fuel — website

A fast, dependency-free static site. No build step, no subscriptions, no framework — just HTML, CSS and a little vanilla JS. Every image in this version is a placeholder from picsum.photos so you can see the layout; swap them for your own work before launch.

## Files

```
index.html                        Home
work-interior-architecture.html   Projects overview (Interior & Architecture)
project.html                      Single project — full masonry grid (?slug=...)
work-travel-films.html            Travel films — YouTube playlist embed
work-corporate-films.html         Corporate films — YouTube playlist embed
about.html
contact.html
css/style.css                     All design tokens + styles live here
js/main.js                        Nav toggle, scroll reveals, footer year
js/projects-data.js               Interior & Architecture project + photo data
js/project.js                     Renders project.html from the data above
images/logo/                      Your logo files
```

## 1. Your logo

`images/logo/horizontal-black.png` (full lockup) is used in the nav and footer on every page. It auto-inverts to white via CSS when it sits on a dark background (the homepage hero/footer) and switches back to black once the nav goes solid — no separate white file needed. `images/logo/mnemonic-black.png` (the mark on its own) isn't used yet; it's there if you ever want a compact version for a favicon or a tight mobile nav.

## 2. Interior & Architecture — adding/editing projects

This page now works as **Projects → click in → full set**, matching the grid layout you liked:
- `work-interior-architecture.html` lists project cover cards.
- `project.html?slug=...` renders the full masonry grid for whichever project's slug is in the URL.
- All photo data lives in **`js/projects-data.js`** — that's the only place you touch to add, remove or reorder photos within a project.

**To add a new project:**
1. Open `js/projects-data.js`, copy an existing project block, give it a new `slug` (no spaces, e.g. `"greywell-house"`), and list its photos. Mark one or two as `tall: true` for the occasional standout portrait shot, like in your reference grid.
2. Open `work-interior-architecture.html`, copy one of the `<a class="work-tile">` cover cards, update the `href` to `project.html?slug=greywell-house`, the cover image, and the title/location text.

That's it — no new HTML page needed per project.

## 3. Travel Films & Corporate Films — YouTube playlists

Both pages now embed a YouTube playlist player instead of static cards. Whatever's in the playlist on YouTube is what shows here — add a new video to the playlist and it appears on the site automatically, with no edits needed (this is actually better than a weekly refresh: it's instant).

**To activate it:**
1. On YouTube, create/open the playlist (e.g. "Travel Films" and "Corporate Films" — two separate playlists, one per page).
2. Copy the playlist URL and grab the ID after `list=`.
3. In `work-travel-films.html` and `work-corporate-films.html`, replace `YOUR_PLAYLIST_ID` in the `<iframe src="...">` line with that ID.

If you'd rather keep some videos unlisted/private, that's fine — set the playlist itself to "Unlisted" on YouTube and the embed still works for anyone with the page link.

## 4. Instagram feed (Interior & Architecture and Travel Films pages)

There's a placeholder block on both pages marked `id="instagram-feed-embed"` with instructions in an HTML comment above it. Instagram doesn't offer a truly free, no-code, always-auto-syncing widget on its own — you need a small third-party widget for that part. A few reputable ones with a free tier:

- **elfsight.com** — Instagram Feed widget, free tier available.
- **sociablekit.com** — free forever plan, though auto-sync may be limited to manual refresh on the free tier (paid unlocks always-on auto-sync).
- **commoninja.com** — similar free-tier setup.

**Setup is the same on all three:** sign up free → connect your Instagram account → pick a layout → copy the embed snippet they give you → paste it into the page in place of the placeholder `<div id="instagram-feed-embed">...</div>` block. Takes about two minutes. Check each provider's current free-tier limits (view caps, sync frequency) before picking one, since these terms change from time to time — pick whichever's current free plan fits a portfolio site's traffic.

## 5. Swap in your real work

Every placeholder image is a normal `<img src="https://picsum.photos/seed/...">` tag — replace the `src` with a path to your own photo, e.g. `images/brass-house-01.jpg`. Create an `images/` folder next to `index.html` (alongside the existing `images/logo/`) and drop your exported photos there.

**Image prep for speed (do this before uploading):**
- Export at the size it'll actually display (hero images ~1600px wide, gallery images ~900–1200px wide) — don't upload 6000px camera originals.
- Convert to **WebP** (smaller than JPEG at the same quality). Free tools: squoosh.app (in-browser, no install).
- Aim for under 250KB per photo. Squoosh shows file size live as you adjust quality.
- Keep `width`/`height` attributes matching the real image's aspect ratio so the page doesn't jump while loading.

## 6. Hosting — completely free options

Any of these will serve a static site like this one at no cost, with a custom domain:

- **Cloudflare Pages** — drag-and-drop the folder, fast global CDN, free SSL. Easiest of the three.
- **Netlify** — same idea, drag-and-drop deploy, free tier is generous for a portfolio site.
- **GitHub Pages** — free if you're comfortable putting the code in a GitHub repo.

To point **soulandfuel.com** at any of them: in your domain registrar's DNS settings, add the CNAME/A records the host gives you after you create the site (each has a short "connect a custom domain" guide). No code changes needed on your end.

## 7. Contact form (free, no backend)

The form on `contact.html` posts to **Formspree** (free tier: 50 submissions/month, no card required):
1. Go to formspree.io and create a free account.
2. Create a new form, copy the form ID it gives you.
3. In `contact.html`, replace `YOUR_FORM_ID` in the `<form action="...">` line with it.

Submissions land in your email — no server needed.

## 8. Why it'll load fast

- No frameworks, no build tools — just HTML/CSS/JS, your images, and one logo file.
- The YouTube and Instagram embeds load lazily and don't block the rest of the page.
- Fonts load from Google Fonts with `display=swap` (text shows immediately, swaps to the real font when ready) and `preconnect` hints.
- Images use `loading="lazy"` so only what's near the viewport downloads.
- All animation is CSS, not JavaScript — cheaper for the browser.

The only thing that will slow this site down going forward is unoptimized photos/video — follow the image prep steps above and it'll stay quick.

## 9. Producing video with Remotion (optional)

`remotion/` is a self-contained [Remotion](https://remotion.dev) project for building video assets (intros, animated titles, promo clips) with React instead of a traditional editor. It has its own `package.json`/dependencies and is completely separate from the static site above — it doesn't add any framework or build step to the pages themselves. Render a clip there, export the `.mp4`, then use it on the site like any other video (e.g. a hero background or a file you upload to a YouTube playlist). See `remotion/README.md` for setup and usage.

## 10. Editing the design

All colors, type and spacing are defined as CSS variables at the top of `css/style.css`:
```css
--ink        /* near-black background */
--parchment  /* warm off-white background */
--ember      /* the accent color (currently a warm terracotta) */
--slate      /* muted secondary text/UI color */
```
Change these and the whole site updates — the palette is centralized on purpose.
