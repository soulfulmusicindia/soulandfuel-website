// Manage your client delivery pages: list them, edit the Drive link,
// delete (archive) them, or restore a deleted one.
//
// Usage: double-click "Manage deliveries.bat". It shows every live delivery,
// then lets you pick one to edit or delete. "Delete" moves the page to an
// archive (the live link goes dead, but nothing is destroyed) so you can
// always restore it. Changes are published automatically.

const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const clientsDir = path.join(repoRoot, "clients");
const archiveDir = path.join(clientsDir, "_archive");

// Buffered line reader: robust whether input is typed or piped in a chunk.
function makeReader() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });
  const queue = [];
  const waiters = [];
  let closed = false;
  rl.on("line", function (l) {
    if (waiters.length) waiters.shift()(l);
    else queue.push(l);
  });
  rl.on("close", function () {
    closed = true;
    while (waiters.length) waiters.shift()("");
  });
  function ask(q) {
    process.stdout.write(q);
    return new Promise(function (res) {
      if (queue.length) res(queue.shift().trim());
      else if (closed) res("");
      else waiters.push(function (l) { res((l || "").trim()); });
    });
  }
  return { ask: ask, close: function () { rl.close(); } };
}
function readField(html, re) {
  const m = html.match(re);
  return m ? m[1] : "";
}
function unesc(s) {
  return String(s || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}
function pageInfo(dir, slug) {
  const idx = path.join(dir, "index.html");
  if (!fs.existsSync(idx)) return null;
  const html = fs.readFileSync(idx, "utf8");
  return {
    slug: slug,
    title: unesc(readField(html, /<h1 class="deliver-title">([\s\S]*?)<\/h1>/)) || slug,
    drive: readField(html, /class="btn deliver-btn" href="([^"]*)"/),
  };
}
function listIn(base) {
  let entries = [];
  try { entries = fs.readdirSync(base, { withFileTypes: true }); } catch (e) { return []; }
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory() || e.name.startsWith("_")) continue;
    const info = pageInfo(path.join(base, e.name), e.name);
    if (info) out.push(info);
  }
  return out;
}

function publish(msg) {
  try {
    execSync("git add -A clients", { cwd: repoRoot, stdio: "ignore" });
    execSync('git commit -m "' + msg.replace(/"/g, "'") + '"', { cwd: repoRoot, stdio: "ignore" });
    execSync("git push origin master", { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}
function showDetails(it) {
  console.log("\n  Project: " + it.title);
  console.log("  Live link: https://www.soulandfuel.com/clients/" + it.slug + "/");
  console.log("  Drive: " + (it.drive || "(none)"));
}

async function editDrive(ask, it) {
  showDetails(it);
  const newDrive = await ask("\nPaste the NEW Google Drive link (or Enter to cancel): ");
  if (!newDrive) { console.log("\nCancelled — nothing changed.\n"); return; }
  if (!/^https?:\/\//i.test(newDrive)) { console.log("\nThat doesn't look like a link (should start with https://). Nothing changed.\n"); return; }
  const idx = path.join(clientsDir, it.slug, "index.html");
  let html = fs.readFileSync(idx, "utf8");
  const safe = newDrive.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  html = html.replace(/(class="btn deliver-btn" href=")[^"]*(")/, "$1" + safe + "$2");
  fs.writeFileSync(idx, html);
  console.log("\nUpdated. Publishing...");
  console.log(publish("Update Drive link for " + it.slug)
    ? "\nDone. Live in ~1-2 minutes. Same short link as before — no need to re-send.\n"
    : "\nSaved the change, but publishing failed. Check your internet and re-run.\n");
}

async function deletePage(ask, it) {
  console.log("\n  You're about to DELETE this delivery (its live link will stop working):");
  showDetails(it);
  console.log("\n  (It will be archived, so you can restore it later from this tool.)");
  const sure = await ask('\nTo confirm, type the project name exactly ("' + it.title + '"): ');
  if (sure !== it.title) { console.log("\nName didn't match — cancelled. Nothing was deleted.\n"); return; }
  fs.mkdirSync(archiveDir, { recursive: true });
  const dest = path.join(archiveDir, it.slug);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.renameSync(path.join(clientsDir, it.slug), dest);
  console.log("\nArchived. Publishing...");
  console.log(publish("Archive delivery page " + it.slug)
    ? "\nDone. The live link is off in ~1-2 minutes. Restore anytime from this tool.\n"
    : "\nArchived the files, but publishing failed. Check your internet and re-run.\n");
}

async function restoreFlow(ask, archived) {
  console.log("\nArchived (deleted) deliveries:\n");
  archived.forEach(function (it, i) { console.log("  " + (i + 1) + ". " + it.title + "   (clients/" + it.slug + "/)"); });
  const pick = await ask("\nNumber to RESTORE (or Enter to cancel): ");
  const n = parseInt(pick, 10);
  if (!pick || isNaN(n) || n < 1 || n > archived.length) { console.log("\nNothing changed.\n"); return; }
  const it = archived[n - 1];
  const dest = path.join(clientsDir, it.slug);
  if (fs.existsSync(dest)) { console.log("\nA live page with that name already exists — cancelled.\n"); return; }
  fs.renameSync(path.join(archiveDir, it.slug), dest);
  console.log("\nRestored. Publishing...");
  console.log(publish("Restore delivery page " + it.slug)
    ? "\nDone. The link works again in ~1-2 minutes.\n"
    : "\nRestored the files, but publishing failed. Check your internet and re-run.\n");
}

async function main() {
  const live = listIn(clientsDir);
  const archived = listIn(archiveDir);

  if (!live.length && !archived.length) {
    console.log("\nNo delivery pages yet. Use \"Make delivery.bat\" to create one.\n");
    return;
  }

  console.log("\nYour live client deliveries:\n");
  if (live.length) {
    live.forEach(function (it, i) {
      console.log("  " + (i + 1) + ". " + it.title);
      console.log("       link:  https://www.soulandfuel.com/clients/" + it.slug + "/");
      console.log("       drive: " + (it.drive || "(none)") + "\n");
    });
  } else {
    console.log("  (none)\n");
  }
  if (archived.length) console.log("  " + archived.length + " archived (deleted) page(s) — type R to restore one.\n");

  const reader = makeReader();
  const ask = reader.ask;
  const pick = await ask("Type a number to edit/delete it" + (archived.length ? ", R to restore" : "") + " (or Enter to quit): ");

  if (archived.length && pick.toLowerCase() === "r") { await restoreFlow(ask, archived); reader.close(); return; }

  const n = parseInt(pick, 10);
  if (!pick || isNaN(n) || n < 1 || n > live.length) { reader.close(); console.log("\nNothing changed.\n"); return; }
  const it = live[n - 1];

  const action = (await ask("\n[E]dit the Drive link, or [D]elete this delivery? (E/D): ")).toLowerCase();
  if (action === "e") await editDrive(ask, it);
  else if (action === "d") await deletePage(ask, it);
  else console.log("\nNothing changed.\n");
  reader.close();
}

main();
