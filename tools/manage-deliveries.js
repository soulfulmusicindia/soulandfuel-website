// Manage your client delivery pages: list them, edit the Drive link, or delete.
//
// Usage: double-click "Manage deliveries.bat". It shows every delivery you've
// made, then lets you pick one to edit (change the Google Drive link) or
// delete. Changes are published automatically.

const path = require("path");
const fs = require("fs");
const readline = require("readline");
const { execSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const clientsDir = path.join(repoRoot, "clients");

function ask(rl, q) {
  return new Promise(function (res) { rl.question(q, function (a) { res((a || "").trim()); }); });
}
function readField(html, re) {
  const m = html.match(re);
  return m ? m[1] : "";
}
function unesc(s) {
  return String(s || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
}

function listDeliveries() {
  let entries = [];
  try { entries = fs.readdirSync(clientsDir, { withFileTypes: true }); } catch (e) { return []; }
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const idx = path.join(clientsDir, e.name, "index.html");
    if (!fs.existsSync(idx)) continue;
    const html = fs.readFileSync(idx, "utf8");
    const title = unesc(readField(html, /<h1 class="deliver-title">([\s\S]*?)<\/h1>/));
    const drive = readField(html, /class="btn deliver-btn" href="([^"]*)"/);
    out.push({ slug: e.name, title: title || e.name, drive: drive });
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

async function main() {
  const items = listDeliveries();
  if (!items.length) {
    console.log("\nNo delivery pages yet. Use \"Make delivery.bat\" to create one.\n");
    return;
  }

  console.log("\nYour client deliveries:\n");
  items.forEach(function (it, i) {
    console.log("  " + (i + 1) + ". " + it.title);
    console.log("       link:  https://www.soulandfuel.com/clients/" + it.slug + "/");
    console.log("       drive: " + (it.drive || "(none)") + "\n");
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pick = await ask(rl, "Type a number to edit/delete it (or Enter to quit): ");
  const n = parseInt(pick, 10);
  if (!pick || isNaN(n) || n < 1 || n > items.length) { rl.close(); console.log("\nNothing changed.\n"); return; }
  const it = items[n - 1];

  const action = (await ask(rl, "\n[E]dit the Drive link, or [D]elete this delivery? (E/D): ")).toLowerCase();

  if (action === "d") {
    const sure = (await ask(rl, 'Type "delete" to confirm removing "' + it.title + '": ')).toLowerCase();
    rl.close();
    if (sure !== "delete") { console.log("\nCancelled.\n"); return; }
    fs.rmSync(path.join(clientsDir, it.slug), { recursive: true, force: true });
    console.log("\nDeleted locally. Publishing...");
    console.log(publish("Delete delivery page " + it.slug)
      ? "\nDone. The page is gone in ~1-2 minutes.\n"
      : "\nRemoved the files, but publishing failed. Check your internet and re-run.\n");
    return;
  }

  if (action === "e") {
    console.log("\nCurrent Drive link:\n  " + (it.drive || "(none)"));
    const newDrive = await ask(rl, "\nPaste the new Google Drive link (or Enter to cancel): ");
    rl.close();
    if (!newDrive) { console.log("\nCancelled.\n"); return; }
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
    return;
  }

  rl.close();
  console.log("\nNothing changed.\n");
}

main();
