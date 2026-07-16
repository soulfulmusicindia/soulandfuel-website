// Make a client delivery page: a short link with a real preview thumbnail.
//
// Usage: double-click "Make delivery.bat" and answer the prompts (project,
// client, Drive link), then pick a cover photo. It optimizes the cover,
// builds a branded delivery page at clients/<slug>/, publishes it, and
// copies a short shareable URL to your clipboard.
//
// (For testing it also accepts flags:
//   node make-delivery.js --project "X" --client "Y" --drive "Z" --cover "path" [--dry] )

const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");

let sharp;
try {
  sharp = require("sharp");
} catch (e) {
  console.log("\nCouldn't load the image tool. Run this from inside the website folder.\n");
  process.exit(1);
}

const repoRoot = path.resolve(__dirname, "..");
const DRY = process.argv.includes("--dry");

function argVal(name) {
  const i = process.argv.indexOf("--" + name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function slugify(s) {
  return (String(s == null ? "" : s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40)) || "gallery";
}
function pickFile() {
  const ps =
    "Add-Type -AssemblyName System.Windows.Forms; " +
    "$f = New-Object System.Windows.Forms.OpenFileDialog; " +
    "$f.Filter = 'Images (*.jpg;*.jpeg;*.png)|*.jpg;*.jpeg;*.png'; " +
    "$f.Title = 'Choose a cover photo (or Cancel to skip)'; " +
    "if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.FileName }";
  try {
    return execSync('powershell -NoProfile -STA -Command "' + ps + '"', { encoding: "utf8" }).trim();
  } catch (e) {
    return "";
  }
}
function ask(rl, q) {
  return new Promise(function (res) { rl.question(q, function (a) { res((a || "").trim()); }); });
}

async function main() {
  let project = argVal("project");
  let client = argVal("client");
  let drive = argVal("drive");
  let cover = argVal("cover");

  if (project === undefined || client === undefined || drive === undefined) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (project === undefined) project = await ask(rl, "Project name: ");
    if (client === undefined) client = await ask(rl, "Client / studio (optional, press Enter to skip): ");
    if (drive === undefined) drive = await ask(rl, "Google Drive folder link: ");
    rl.close();
  }
  project = (project || "").trim();
  client = (client || "").trim();
  drive = (drive || "").trim();

  if (!project || !drive) {
    console.log("\nProject name and a Google Drive link are both required.\n");
    process.exit(1);
  }

  if (cover === undefined) {
    console.log("\nChoose a cover photo in the pop-up (or Cancel to skip)...");
    cover = pickFile();
  }
  cover = (cover || "").trim().replace(/^"+|"+$/g, "");

  const slug = slugify(project) + "-" + Date.now().toString(36).slice(-5);
  const dir = path.join(repoRoot, "clients", slug);
  fs.mkdirSync(dir, { recursive: true });

  let hasCover = false;
  if (cover) {
    if (!fs.existsSync(cover)) {
      console.log("\nCover photo not found:\n  " + cover + "\n");
      process.exit(1);
    }
    try {
      await sharp(cover).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(dir, "cover.jpg"));
      hasCover = true;
    } catch (e) {
      console.log("\nThat cover file could not be read as an image (try a JPG or PNG).\n");
      process.exit(1);
    }
  }

  const base = "https://www.soulandfuel.com/clients/" + slug + "/";
  fs.writeFileSync(path.join(dir, "index.html"), buildPage({ project: project, client: client, drive: drive, slug: slug, hasCover: hasCover }));

  const kb = hasCover ? Math.round(fs.statSync(path.join(dir, "cover.jpg")).size / 1024) : 0;
  console.log("\nBuilt: clients/" + slug + "/" + (hasCover ? "  (cover " + kb + " KB)" : "  (no cover)"));

  if (DRY) {
    console.log("(dry run — not published)\n");
    return;
  }

  try {
    execSync('git add "' + dir + '"', { cwd: repoRoot, stdio: "ignore" });
    execSync('git commit -m "Add delivery page ' + slug + '"', { cwd: repoRoot, stdio: "ignore" });
    execSync("git push origin master", { cwd: repoRoot, stdio: "ignore" });
  } catch (e) {
    console.log("\nBuilt the page, but publishing failed. Check your internet and try again.\n");
    process.exit(1);
  }

  try { execSync("cmd /c echo " + base + "| clip"); } catch (e) {}
  console.log("\nPublished — and copied to your clipboard. Send this to your client:\n");
  console.log("  " + base + "\n");
  console.log("Live in ~1-2 minutes, with a preview thumbnail. Short link, kept out of search.\n");
}

function buildPage(o) {
  const P = esc(o.project), C = esc(o.client), D = esc(o.drive);
  const base = "https://www.soulandfuel.com/clients/" + o.slug + "/";
  const ogImage = o.hasCover
    ? '<meta property="og:image" content="' + base + 'cover.jpg">\n<meta property="og:image:alt" content="' + P + '">\n'
    : "";
  const coverBlock = o.hasCover
    ? '\n  <div class="deliver-cover"><img src="cover.jpg" alt="' + P + ' — cover"></div>\n'
    : "";
  const subBlock = C ? '<p class="deliver-sub">Prepared for ' + C + "</p>" : "";

  return '<!doctype html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'<meta charset="UTF-8">\n' +
'<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
'<meta name="robots" content="noindex, nofollow">\n' +
'<title>Your Gallery — ' + P + ' — Soul &amp; Fuel</title>\n' +
'<meta property="og:type" content="website">\n' +
'<meta property="og:title" content="' + P + ' — your gallery from Soul &amp; Fuel">\n' +
'<meta property="og:description" content="' + (C ? "Prepared for " + C + ". " : "") + 'Tap to view and download your full-resolution files.">\n' +
ogImage +
'<meta property="og:url" content="' + base + '">\n' +
'<meta name="twitter:card" content="summary_large_image">\n' +
'<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
'<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,600;1,500&family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">\n' +
'<link rel="stylesheet" href="/css/style.css">\n' +
'<meta name="theme-color" content="#f3ede3">\n' +
'<link rel="icon" href="/images/logo/mnemonic-black.png" type="image/png">\n' +
'</head>\n' +
'<body>\n' +
'\n' +
'<header class="deliver-nav">\n' +
'  <a href="/index.html" class="logo-mark" aria-label="Soul & Fuel Media home">\n' +
'    <img src="/images/logo/horizontal-black.png" alt="Soul & Fuel Media">\n' +
'  </a>\n' +
'</header>\n' +
'\n' +
'<section class="deliver wrap">\n' +
'  <span class="eyebrow">Client Delivery</span>\n' +
'  <h1 class="deliver-title">' + P + '</h1>\n' +
'  ' + subBlock + '\n' +
coverBlock +
'  <p class="deliver-note">Your final edited photographs are ready — tap the button below to view and download your full-resolution files.</p>\n' +
'  <a class="btn deliver-btn" href="' + D + '" target="_blank" rel="noopener">View &amp; download your gallery &rarr;</a>\n' +
'  <p class="deliver-meta">Full resolution &middot; Delivered via Google Drive &middot; <span class="deliver-expiry">Link active for 15 days</span></p>\n' +
'  <p class="deliver-help">Please keep a backup of your files. Any trouble opening them? <a href="/contact.html">Get in touch</a> and we\'ll sort it out.</p>\n' +
'</section>\n' +
'\n' +
EXPLORE +
'\n' +
FOOTER +
'\n' +
'<script src="/js/main.js" defer></script>\n' +
'</body>\n' +
'</html>\n';
}

const EXPLORE =
'<section class="explore">\n' +
'  <div class="wrap">\n' +
'    <div class="explore-head">\n' +
'      <span class="eyebrow">While you\'re here</span>\n' +
'      <h2 class="explore-title">More of our work</h2>\n' +
'      <p class="explore-dek">A few recent spaces we\'ve shot for designers and studios across India.</p>\n' +
'    </div>\n' +
'    <div class="explore-grid">\n' +
'      <a class="explore-card" href="/project-tata-promont.html"><img src="/images/projects/tata-promont/dsc06603.jpg" alt="Tata Promont" loading="lazy"><span class="explore-card-label">Tata Promont</span></a>\n' +
'      <a class="explore-card" href="/project-aikya.html"><img src="/images/projects/aikya/syzygy-02593.jpg" alt="Aikya" loading="lazy"><span class="explore-card-label">Aikya</span></a>\n' +
'      <a class="explore-card" href="/project-bunsik-cafe.html"><img src="/images/projects/bunsik-cafe/dsc07150.jpg" alt="Bunsik Cafe" loading="lazy"><span class="explore-card-label">Bunsik Cafe</span></a>\n' +
'      <a class="explore-card" href="/project-cobalt-manor.html"><img src="/images/projects/cobalt-manor/cover.jpg" alt="Cobalt Manor" loading="lazy"><span class="explore-card-label">Cobalt Manor</span></a>\n' +
'    </div>\n' +
'    <a class="explore-viewall" href="/work-interior-architecture.html">View the full portfolio &rarr;</a>\n' +
'    <div class="explore-nudges">\n' +
'      <div class="nudge"><h3>Get your project published</h3><p>Homes we\'ve shot have run in ELLE Decor, Good Homes &amp; more.</p><a href="/work-interior-architecture.html#featured">See our press &rarr;</a></div>\n' +
'      <div class="nudge"><h3>Tag us when you post</h3><p>Share these and tag us — we\'ll happily reshare to our audience.</p><a href="https://instagram.com/soulandfuel_media" target="_blank" rel="noopener">@soulandfuel_media &rarr;</a></div>\n' +
'      <div class="nudge"><h3>Planning your next shoot?</h3><p>Residential, hospitality or commercial — let\'s plan it.</p><a href="/contact.html">Get in touch &rarr;</a></div>\n' +
'    </div>\n' +
'  </div>\n' +
'</section>\n';

const FOOTER =
'<footer class="site-footer">\n' +
'  <div class="wrap">\n' +
'    <div class="footer-grid">\n' +
'      <a href="/index.html" class="logo-mark"><img src="/images/logo/horizontal-black.png" alt="Soul & Fuel Media"></a>\n' +
'      <ul class="footer-links">\n' +
'        <li><a href="/work-interior-architecture.html">Interior &amp; Architecture</a></li>\n' +
'        <li><a href="/work-travel-films.html">Travel Films</a></li>\n' +
'        <li><a href="/work-corporate-films.html">Corporate Films</a></li>\n' +
'        <li><a href="/blog.html">Blog</a></li>\n' +
'        <li><a href="/about.html">About</a></li>\n' +
'        <li><a href="/contact.html">Contact</a></li>\n' +
'      </ul>\n' +
'    </div>\n' +
'    <div class="footer-bottom">\n' +
'      <span>&copy; <span data-year></span> Soul &amp; Fuel Media</span>\n' +
'      <span><a href="https://instagram.com/soulandfuel_media" target="_blank" rel="noopener">Instagram</a> &middot; <a href="https://www.youtube.com/@SoulandFuel/playlists" target="_blank" rel="noopener">YouTube</a> &middot; <a href="https://in.linkedin.com/in/mahesh91" target="_blank" rel="noopener">LinkedIn</a></span>\n' +
'    </div>\n' +
'  </div>\n' +
'</footer>\n';

main();
