// Build-time: produce a clean Convex deployment (schema + functions, no user
// data) that ships inside the app so the very first launch works fully offline
// with no Node, no terminal, no `convex dev`.
//
// What it does:
//   1. Locate the convex-local-backend binary (downloaded by `convex dev`).
//   2. Copy it into electron/backend/ so electron-builder can bundle it.
//   3. Spawn it against a FRESH seed data dir (fixed instance name/secret).
//   4. `convex deploy` this project's functions into that backend.
//   5. Stop the backend. The seed dir now holds schema + functions.
//
// Run automatically before `npm run dist` (see package.json "predist").

import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const cfg = require("../electron/convex-local.config.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BACKEND_DIR = path.join(ROOT, "electron", "backend");
const SEED_DIR = path.join(BACKEND_DIR, "seed");
const SEED_DB = path.join(SEED_DIR, "convex_local_backend.sqlite3");
const SEED_STORAGE = path.join(SEED_DIR, "convex_local_storage");
const BIN_NAME = "convex-local-backend.exe";
const BIN_DEST = path.join(BACKEND_DIR, BIN_NAME);

const log = (...a) => console.log("[seed]", ...a);

// ── 1. find the backend binary that `convex dev` already downloaded ─────────
function findBinary() {
  const base = path.join(process.env.LOCALAPPDATA || "", "convex", "binaries");
  if (!fs.existsSync(base)) throw new Error("convex binaries cache not found: " + base);
  // pick newest precompiled-* folder containing the exe
  const candidates = fs
    .readdirSync(base)
    .map((d) => path.join(base, d, BIN_NAME))
    .filter((p) => fs.existsSync(p));
  if (!candidates.length) throw new Error("convex-local-backend.exe not found under " + base);
  candidates.sort();
  return candidates[candidates.length - 1];
}

function waitForBackend(timeoutMs = 60000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(
        { host: "127.0.0.1", port: cfg.cloudPort, path: "/version", timeout: 2000 },
        (res) => {
          res.resume();
          resolve();
        }
      );
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) reject(new Error("backend never became ready"));
        else setTimeout(tick, 500);
      });
      req.on("timeout", () => {
        req.destroy();
        if (Date.now() - started > timeoutMs) reject(new Error("backend ready timeout"));
        else setTimeout(tick, 500);
      });
    };
    tick();
  });
}

async function main() {
  // fresh seed dir
  fs.rmSync(SEED_DIR, { recursive: true, force: true });
  fs.mkdirSync(SEED_STORAGE, { recursive: true });

  // copy binary for bundling
  const srcBin = findBinary();
  log("binary:", srcBin);
  fs.copyFileSync(srcBin, BIN_DEST);
  log("copied binary →", BIN_DEST);

  // admin key for deploy
  const kg = spawnSync(
    BIN_DEST,
    ["keygen", "admin-key", "--instance-name", cfg.instanceName, "--instance-secret", cfg.instanceSecret],
    { encoding: "utf8" }
  );
  if (kg.status !== 0) throw new Error("keygen failed: " + kg.stderr);
  const adminKey = kg.stdout.trim();
  log("admin key generated");

  // spawn backend against the fresh seed dir
  const backend = spawn(
    BIN_DEST,
    [
      "--port", String(cfg.cloudPort),
      "--site-proxy-port", String(cfg.sitePort),
      "--instance-name", cfg.instanceName,
      "--instance-secret", cfg.instanceSecret,
      "--local-storage", SEED_STORAGE,
      "--disable-beacon",
      SEED_DB,
    ],
    { cwd: SEED_DIR, stdio: "inherit" }
  );

  const cleanup = () => { try { backend.kill(); } catch {} };
  process.on("exit", cleanup);
  process.on("SIGINT", () => { cleanup(); process.exit(1); });

  log("waiting for backend on", cfg.cloudPort, "…");
  await waitForBackend();
  log("backend ready — deploying functions");

  // deploy this project's convex functions into the local backend
  const env = { ...process.env };
  delete env.CONVEX_DEPLOYMENT; // force self-hosted target, ignore .env.local
  env.CONVEX_SELF_HOSTED_URL = `http://127.0.0.1:${cfg.cloudPort}`;
  env.CONVEX_SELF_HOSTED_ADMIN_KEY = adminKey;

  // The CLI also reads CONVEX_DEPLOYMENT from .env.local, which conflicts with
  // the self-hosted vars. Move it aside for the deploy, then restore it.
  const envLocal = path.join(ROOT, ".env.local");
  const envLocalBak = path.join(ROOT, ".env.local.seedbak");
  const hadEnvLocal = fs.existsSync(envLocal);
  if (hadEnvLocal) fs.renameSync(envLocal, envLocalBak);

  // Invoke the Convex CLI directly via Node (avoids the Windows .cmd spawn
  // restriction that makes `npx.cmd` fail with a null exit code).
  const convexCli = path.join(path.dirname(require.resolve("convex/package.json")), "bin", "main.js");
  let deploy;
  try {
    deploy = spawnSync(
      process.execPath,
      [convexCli, "deploy", "--yes", "--typecheck", "disable"],
      { cwd: ROOT, env, stdio: "inherit" }
    );
  } finally {
    if (hadEnvLocal && fs.existsSync(envLocalBak)) fs.renameSync(envLocalBak, envLocal);
  }

  cleanup();
  // give the backend a moment to flush + release the sqlite file
  await new Promise((r) => setTimeout(r, 1500));

  if (deploy.status !== 0) throw new Error("convex deploy failed (exit " + deploy.status + ")");

  if (!fs.existsSync(SEED_DB)) throw new Error("seed db missing after deploy");
  const modules = fs.existsSync(path.join(SEED_STORAGE, "modules"))
    ? fs.readdirSync(path.join(SEED_STORAGE, "modules")).length
    : 0;
  log(`✓ seed ready — db + ${modules} module blob(s) in ${SEED_DIR}`);
}

main().catch((e) => {
  console.error("[seed] FAILED:", e.message);
  process.exit(1);
});
