const path = require("path");
const fs = require("fs");
function loadEnv() {
  const raw = fs.readFileSync(path.join(__dirname, ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
}
loadEnv();
const { Client } = require("pg");

async function main() {
  const file = process.argv[2];
  const sql = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("commit");
    console.log("OK:", file, "aplicado (commit).");
  } catch (err) {
    await client.query("rollback");
    console.error("FAIL:", err.message.split("\n")[0]);
    throw err;
  } finally {
    await client.end();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });