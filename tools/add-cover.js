// Add a hidden delivery cover image to the site.
//
// Usage:
//   - Drag a photo onto "Add cover.bat", OR
//   - Double-click "Add cover.bat" and pick a photo.
//
// It optimizes the image, saves it into images/covers/ (hidden from the
// public site + search), publishes it, and copies the hosted URL to your
// clipboard. Paste that URL into the "Cover image URL" box in the
// delivery-link generator (make-delivery.html).

const path = require("path");
const fs = require("fs");
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

// Native "choose a file" dialog (used when double-clicked with no photo dropped).
function pickFile() {
  const ps =
    "Add-Type -AssemblyName System.Windows.Forms; " +
    "$f = New-Object System.Windows.Forms.OpenFileDialog; " +
    "$f.Filter = 'Images (*.jpg;*.jpeg;*.png)|*.jpg;*.jpeg;*.png'; " +
    "$f.Title = 'Choose a cover photo'; " +
    "if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $f.FileName }";
  try {
    return execSync('powershell -NoProfile -STA -Command "' + ps + '"', { encoding: "utf8" }).trim();
  } catch (e) {
    return "";
  }
}

// A dragged path with spaces can arrive split across args, so join them back.
let input = process.argv.slice(2).filter(function (a) { return a !== "--dry"; }).join(" ").trim();
input = input.replace(/^"+|"+$/g, "");
if (!input) input = pickFile();

if (!input) {
  console.log("\nNo image chosen.\n");
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.log("\nCan't find that file:\n  " + input + "\n");
  process.exit(1);
}

const rawBase = path.basename(input).replace(/\.[^.]+$/, "");
const slug =
  rawBase.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "cover";
const stamp = Date.now().toString(36).slice(-5);
const name = slug + "-" + stamp + ".jpg";
const outDir = path.join(repoRoot, "images", "covers");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, name);
const url = "https://www.soulandfuel.com/images/covers/" + name;

(async function () {
  try {
    await sharp(input)
      .rotate() // respect camera orientation
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(outPath);
  } catch (e) {
    console.log("\nThat file could not be read as an image (try a JPG or PNG).\n");
    process.exit(1);
  }

  const kb = Math.round(fs.statSync(outPath).size / 1024);
  console.log("\nOptimized: " + name + "  (" + kb + " KB)");

  if (DRY) {
    console.log("(dry run — not published)\n");
    return;
  }

  try {
    execSync('git add "' + outPath + '"', { cwd: repoRoot, stdio: "ignore" });
    execSync('git commit -m "Add hidden delivery cover ' + name + '"', { cwd: repoRoot, stdio: "ignore" });
    execSync("git push origin master", { cwd: repoRoot, stdio: "ignore" });
  } catch (e) {
    console.log("\nThe image was saved but publishing failed. Check your internet and try again.\n");
    process.exit(1);
  }

  try {
    execSync("cmd /c echo " + url + "| clip");
  } catch (e) {}

  console.log("\nPublished — and copied to your clipboard.");
  console.log("Paste this as the Cover image URL in the generator:\n");
  console.log("  " + url + "\n");
  console.log("Live in ~1-2 minutes. Stays hidden from your website and search.\n");
})();
