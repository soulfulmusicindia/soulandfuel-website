// Standard pipeline for adding a new project's photos to the site:
// auto-rotate, resize to the site's usual max dimension, watermark
// with the Soul & Fuel mark, and compress to web-weight JPEGs.
//
// Usage:
//   node scripts/process-project-photos.js "<source folder>" <project-slug>
//
// Writes output to images/projects/<project-slug>/, preserving the
// original filenames (lowercased). Run this on every future project
// upload instead of one-off sharp commands, so watermarking is never
// skipped.

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const WATERMARK_PATH = path.join(ROOT, "images/logo/horizontal-black.png");
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 82;
const WATERMARK_WIDTH_RATIO = 0.0891; // watermark width as a fraction of the photo's longest side
const WATERMARK_MARGIN_RIGHT_RATIO = 0.03; // distance from the right edge, as a fraction of the photo's longest side
const WATERMARK_MARGIN_BOTTOM_RATIO = 0.03; // distance from the bottom edge, as a fraction of the photo's longest side
const WATERMARK_OPACITY = 0.6875;

const [, , srcArg, slugArg] = process.argv;
if (!srcArg || !slugArg) {
  console.error("Usage: node scripts/process-project-photos.js \"<source folder>\" <project-slug>");
  process.exit(1);
}

const SRC = srcArg;
const OUT_DIR = path.join(ROOT, "images/projects", slugArg);

async function buildWatermarkBuffer(longestSide) {
  const wmWidth = Math.round(longestSide * WATERMARK_WIDTH_RATIO);
  const raw = await sharp(WATERMARK_PATH).resize({ width: wmWidth }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { data, info } = raw;
  // Apply opacity by scaling the alpha channel.
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * WATERMARK_OPACITY);
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source folder not found: ${SRC}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(SRC).filter((f) => /\.jpe?g$/i.test(f)).sort();
  if (!files.length) {
    console.error(`No .jpg/.jpeg files found in ${SRC}`);
    process.exit(1);
  }

  const results = [];
  for (const file of files) {
    const srcPath = path.join(SRC, file);
    const outName = file.toLowerCase();
    const outPath = path.join(OUT_DIR, outName);

    const meta = await sharp(srcPath).rotate().metadata();
    const isPortrait = meta.height > meta.width;

    // Materialize the resize first so we know the REAL output dimensions —
    // sharp's .metadata() on a pending pipeline still reports the source
    // image's dimensions, not the resized ones.
    const resizedBuffer = await sharp(srcPath)
      .rotate()
      .resize(isPortrait ? { height: MAX_DIMENSION } : { width: MAX_DIMENSION })
      .toBuffer();
    const resizedMeta = await sharp(resizedBuffer).metadata();
    const resizedLongestSide = Math.max(resizedMeta.width, resizedMeta.height);

    const watermark = await buildWatermarkBuffer(resizedLongestSide);
    const wmMeta = await sharp(watermark).metadata();
    const marginRight = Math.round(resizedLongestSide * WATERMARK_MARGIN_RIGHT_RATIO);
    const marginBottom = Math.round(resizedLongestSide * WATERMARK_MARGIN_BOTTOM_RATIO);

    await sharp(resizedBuffer)
      .composite([
        {
          input: watermark,
          left: resizedMeta.width - wmMeta.width - marginRight,
          top: resizedMeta.height - wmMeta.height - marginBottom
        }
      ])
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(outPath);

    const outStat = fs.statSync(outPath);
    const outMeta = await sharp(outPath).metadata();
    results.push({
      file: outName,
      width: outMeta.width,
      height: outMeta.height,
      tall: outMeta.height > outMeta.width * 1.15,
      kb: Math.round(outStat.size / 1024)
    });
    console.log(`${outName}: ${outMeta.width}x${outMeta.height} (${Math.round(outStat.size / 1024)}KB)`);
  }

  console.log(`\nDone. ${results.length} watermarked images written to ${OUT_DIR}`);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
