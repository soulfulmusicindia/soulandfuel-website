// Generates one new Soul & Fuel blog post every time it's run:
// 1. Asks Claude for an original post about interior/architecture photography,
//    videography or related craft, avoiding topics already covered.
// 2. Renders a static blog-<slug>.html page (same shape as the hand-written
//    posts) using an existing portfolio photo as the header image.
// 3. Inserts a new card into blog.html, adds the URL to sitemap.xml, and
//    records the post in blog-history.json so future runs don't repeat it.
//
// Run manually with:  ANTHROPIC_API_KEY=sk-... node scripts/generate-blog-post.js
// Run automatically by .github/workflows/blog-auto-post.yml every 2 days.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const HISTORY_PATH = path.join(ROOT, "blog-history.json");
const BLOG_INDEX_PATH = path.join(ROOT, "blog.html");
const SITEMAP_PATH = path.join(ROOT, "sitemap.xml");
const SITE_URL = "https://www.soulandfuel.com";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

// Known-good cover photos already used as project covers on the site —
// a safe, curated pool so the generator never picks a bad crop or a
// picsum placeholder.
const IMAGE_POOL = [
  "images/projects/tata-promont/dsc06603.jpg",
  "images/projects/in-the-hills/dsc05429-2.jpg",
  "images/projects/five-summits/dsc08052.jpg",
  "images/projects/cobalt-manor/cover.jpg",
  "images/projects/trifecta-verde/dsc05036.jpg",
  "images/projects/magnolia-resorts/dsc02807.jpg",
  "images/projects/bunsik-cafe/dsc07150.jpg",
  "images/projects/alleviate/dsc08914.jpg",
  "images/projects/aikya/syzygy-02593.jpg",
  "images/projects/sobha-malachite/now_4631.jpg",
  "images/projects/subha-white-waters/dji_20250906175615_0016_d.jpg",
  "images/projects/aalterra/dsc07488.jpg",
  "images/projects/the-old-acre/dji_20250930162018_0166_d.jpg",
  "images/projects/cedar-strings/dsc04231.jpg",
  "images/projects/capitaland/dsc5372_1.jpg",
  "images/projects/model-house-fy/dsc01323.jpg",
  "images/projects/vijayanagara/dsc04664.jpg",
  "images/projects/flair-restaurant/dsc04460.jpg",
  "images/projects/hotel-gsr/snf06393.jpg",
  "images/projects/yolotel/dsc05006.jpg",
  "images/projects/countryside-raindance/dji_20251021130946_0414_d.jpg",
  "images/projects/dnr-highline/snf1792.jpg"
];

function readHistory() {
  if (!fs.existsSync(HISTORY_PATH)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function uniqueSlug(base) {
  let slug = base;
  let n = 2;
  while (fs.existsSync(path.join(ROOT, `blog-${slug}.html`))) {
    slug = `${base}-${n}`;
    n++;
  }
  return slug;
}

function pickImage(history) {
  const recentlyUsed = new Set(history.slice(0, 5).map((h) => h.image));
  const fresh = IMAGE_POOL.filter((img) => !recentlyUsed.has(img));
  const pool = fresh.length ? fresh : IMAGE_POOL;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function generatePostContent(history) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }

  const pastTitles = history.slice(0, 25).map((h) => `- ${h.title} (${h.category})`).join("\n") || "(none yet)";
  const lastCategory = history[0] ? history[0].category : "(none yet)";

  const system = `You are the in-house writer for Soul & Fuel Media, a one-person interior & architecture photography, travel film and corporate film studio based in Bengaluru, India, run by a photographer named Mahesh. You write in first person ("I"), warm but precise, specific and practical rather than generic marketing fluff — every post should teach the reader something a working photographer/videographer actually knows. Never use filler phrases like "in today's world" or "when it comes to". Output ONLY a single valid JSON object, no markdown fences, no commentary.`;

  const user = `Write one new blog post for the Soul & Fuel journal about interior/architecture photography, videography, or the craft/business around them (topics like: light, composition, editing workflow, gear choices, drone/aerial work, working with clients and stylists, real estate marketing, travel or corporate filmmaking technique, post-production, print vs digital delivery, etc).

Do NOT repeat or lightly rephrase any of these already-published topics:
${pastTitles}

Try to pick a different category than the most recent post's category ("${lastCategory}") for variety, unless a topic genuinely fits best elsewhere.

Return a JSON object with exactly these fields:
{
  "title": "string, specific and non-generic, under 70 characters",
  "category": "one of: Photography, Videography, Behind The Scenes, Client Advice, Industry",
  "excerpt": "one sentence, under 160 characters, usable as a meta description",
  "readMinutes": integer between 4 and 7,
  "tags": ["2 to 4 short tags"],
  "body": [
    { "type": "p", "text": "opening paragraph, no heading before it" },
    { "type": "h2", "text": "a subheading" },
    { "type": "p", "text": "..." }
  ]
}

The body should have 5-7 paragraphs total across 2-3 h2 sections plus the opening paragraph, roughly 550-750 words all together. Be concrete: reference specific techniques, real trade-offs, and decisions a photographer/filmmaker actually makes, not abstract platitudes.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: "user", content: user }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const raw = data.content.map((c) => c.text || "").join("").trim();
  const jsonText = raw.replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "");
  return JSON.parse(jsonText);
}

function renderPostHtml({ title, slug, category, excerpt, readMinutes, tags, body, image, dateHuman, dateIso }) {
  const bodyHtml = body
    .map((block) => {
      if (block.type === "h2") return `  <h2>${block.text}</h2>`;
      return `  <p class="body-copy">${block.text}</p>`;
    })
    .join("\n");

  const tagsHtml = tags.map((t) => `    <span>${t}</span>`).join("\n");
  const imageUrl = `${SITE_URL}/${image}`;
  const pageUrl = `${SITE_URL}/blog-${slug}.html`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="google-site-verification" content="1UVGyGzbB0PRMju1s7IeErLb-9kcwZFRlJ41k3Kz60Q">
<meta name="msvalidate.01" content="44C91DDE03E362C02EB2FB7DA115C27B">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title} — Soul &amp; Fuel</title>
<meta name="description" content="${excerpt}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,500&family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css">
<link rel="canonical" href="${pageUrl}">
<meta name="theme-color" content="#15140f">
<link rel="icon" href="/images/logo/mnemonic-black.png" type="image/png">
<meta property="og:type" content="article">
<meta property="og:url" content="${pageUrl}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${excerpt}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:site_name" content="Soul & Fuel Media">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${excerpt}">
<meta name="twitter:image" content="${imageUrl}">
</head>
<body>
<header class="site-nav is-solid">
  <div class="wrap">
    <a href="index.html" class="logo-mark" aria-label="Soul & Fuel Media home">
      <img src="images/logo/horizontal-black.png" alt="Soul & Fuel Media">
    </a>
    <nav>
      <ul class="nav-links">
        <li><a href="work-interior-architecture.html">Interior &amp; Architecture</a></li>
        <li><a href="work-travel-films.html">Travel Films</a></li>
        <li><a href="work-corporate-films.html">Corporate Films</a></li>
        <li><a href="blog.html" class="is-active">Blog</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
      <button class="nav-toggle" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </nav>
  </div>
</header>

<section class="cat-hero wrap">
  <a class="back-link" href="blog.html">&larr; All posts</a>
  <h1>${title}</h1>
  <span class="eyebrow">${category} &middot; ${dateHuman}</span>
  <div class="blog-meta">
    <span>Mahesh, Soul &amp; Fuel</span><span class="dot">&middot;</span><span>${readMinutes} min read</span>
  </div>
</section>

<article class="blog-article wrap">
  <img class="blog-hero-img" src="${image}" alt="${title}">

${bodyHtml}

  <div class="blog-tags">
${tagsHtml}
  </div>
</article>

<section class="contact-band">
  <div class="wrap">
    <h2>Have a space worth shooting?</h2>
    <p>Available for residential, hospitality and studio shoots — India-wide.</p>
    <a class="btn btn-light" href="contact.html">Get in touch &rarr;</a>
  </div>
</section>

<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <a href="index.html" class="logo-mark"><img src="images/logo/horizontal-black.png" alt="Soul & Fuel Media"></a>
      <ul class="footer-links">
        <li><a href="work-interior-architecture.html">Interior &amp; Architecture</a></li>
        <li><a href="work-travel-films.html">Travel Films</a></li>
        <li><a href="work-corporate-films.html">Corporate Films</a></li>
        <li><a href="blog.html">Blog</a></li>
        <li><a href="about.html">About</a></li>
        <li><a href="contact.html">Contact</a></li>
      </ul>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year></span> Soul &amp; Fuel Media</span>
      <span><a href="https://instagram.com/soulandfuel_media" target="_blank" rel="noopener">Instagram</a> &middot; <a href="https://www.youtube.com/@SoulandFuel/playlists" target="_blank" rel="noopener">YouTube</a> &middot; <a href="https://in.linkedin.com/in/mahesh91" target="_blank" rel="noopener">LinkedIn</a></span>
    </div>
  </div>
</footer>

<script src="js/main.js" defer></script>
<script src="js/seo.js" defer></script>
</body>
</html>
`;
}

function insertTileIntoBlogIndex({ title, slug, category, readMinutes, image }) {
  const marker = "<!-- BLOG_POSTS_START: new posts are inserted automatically right after this line -->";
  const src = fs.readFileSync(BLOG_INDEX_PATH, "utf8");
  if (!src.includes(marker)) {
    throw new Error("Could not find insertion marker in blog.html");
  }
  const tile = `
  <a class="work-tile" href="blog-${slug}.html">
    <img src="${image}" alt="${title} — cover" loading="lazy">
    <div class="work-tile-label">
      <span class="kicker">${category} &middot; ${readMinutes} min read</span>
      <h3>${title}</h3>
      <span class="arrow">Read the post &rarr;</span>
    </div>
  </a>`;
  const out = src.replace(marker, marker + tile);
  fs.writeFileSync(BLOG_INDEX_PATH, out, "utf8");
}

function addToSitemap(slug) {
  const url = `  <url><loc>${SITE_URL}/blog-${slug}.html</loc><priority>0.6</priority></url>`;
  const src = fs.readFileSync(SITEMAP_PATH, "utf8");
  if (src.includes(url)) return;
  const out = src.replace("</urlset>", `${url}\n</urlset>`);
  fs.writeFileSync(SITEMAP_PATH, out, "utf8");
}

function updateHistory(history, entry) {
  history.unshift(entry);
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2) + "\n", "utf8");
}

async function main() {
  const history = readHistory();
  const post = await generatePostContent(history);

  const baseSlug = slugify(post.title);
  const slug = uniqueSlug(baseSlug);
  const image = pickImage(history);

  const now = new Date();
  const dateIso = now.toISOString().slice(0, 10);
  const dateHuman = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const html = renderPostHtml({
    title: post.title,
    slug,
    category: post.category,
    excerpt: post.excerpt,
    readMinutes: post.readMinutes,
    tags: post.tags,
    body: post.body,
    image,
    dateHuman,
    dateIso
  });

  fs.writeFileSync(path.join(ROOT, `blog-${slug}.html`), html, "utf8");
  insertTileIntoBlogIndex({ title: post.title, slug, category: post.category, readMinutes: post.readMinutes, image });
  addToSitemap(slug);
  updateHistory(history, {
    slug,
    title: post.title,
    category: post.category,
    date: dateIso,
    image
  });

  console.log(`Published: blog-${slug}.html ("${post.title}")`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
