const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { spawn, spawnSync } = require("child_process");

const cfg = require("./convex-local.config.cjs");

const isDev = !app.isPackaged;

// In a packaged build the bundled backend + seed live under resources/backend.
// In dev we don't spawn anything — `npm run dev` already runs `convex dev`.
const backendRoot = isDev
  ? path.join(__dirname, "backend")
  : path.join(process.resourcesPath, "backend");
const backendBin = path.join(backendRoot, "convex-local-backend.exe");
const seedDir = path.join(backendRoot, "seed");

// Live, writable deployment dir (per user). Survives app updates.
const dataDir = path.join(app.getPath("userData"), cfg.dataDirName);
const dataDb = path.join(dataDir, "convex_local_backend.sqlite3");
const dataStorage = path.join(dataDir, "convex_local_storage");

let backendProc = null;

function log(...a) {
  console.log("[slate]", ...a);
}

// Probe the backend's /version endpoint. resolve(true) if it answers.
function ping(timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.get(
      { host: "127.0.0.1", port: cfg.cloudPort, path: "/version", timeout: timeoutMs },
      (res) => {
        res.resume();
        resolve(true);
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await ping()) return true;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

// Copy the shipped seed deployment into the writable data dir on first launch.
function ensureSeed() {
  if (fs.existsSync(dataDb)) return; // already initialized
  if (!fs.existsSync(seedDir)) {
    throw new Error("Seed deployment missing at " + seedDir);
  }
  log("first launch — seeding workspace from", seedDir);
  fs.mkdirSync(dataDir, { recursive: true });
  fs.cpSync(seedDir, dataDir, { recursive: true });
}

async function startBackend() {
  // If something is already serving 3210 (e.g. a dev backend, or a second
  // app instance), just reuse it instead of spawning a duplicate.
  if (await ping()) {
    log("backend already running on", cfg.cloudPort, "— reusing");
    return true;
  }

  ensureSeed();

  log("spawning backend:", backendBin);
  backendProc = spawn(
    backendBin,
    [
      "--port", String(cfg.cloudPort),
      "--site-proxy-port", String(cfg.sitePort),
      "--instance-name", cfg.instanceName,
      "--instance-secret", cfg.instanceSecret,
      "--local-storage", dataStorage,
      "--disable-beacon",
      dataDb,
    ],
    { cwd: dataDir, stdio: "ignore", windowsHide: true }
  );

  backendProc.on("exit", (code) => {
    log("backend exited", code);
    backendProc = null;
  });

  const ready = await waitForBackend();
  if (!ready) {
    log("backend failed to become ready");
    return false;
  }
  log("backend ready on", cfg.cloudPort);
  return true;
}

function stopBackend() {
  if (!backendProc) return;
  const pid = backendProc.pid;
  log("stopping backend", pid);
  try {
    if (process.platform === "win32") {
      // Force-kill the whole process tree on Windows.
      spawnSync("taskkill", ["/pid", String(pid), "/T", "/F"], { windowsHide: true });
    } else {
      backendProc.kill();
    }
  } catch (e) {
    log("kill error", e.message);
  }
  backendProc = null;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: "#191919",
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#19191900",
      symbolColor: "#9b9a97",
      height: 44,
    },
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
    show: false,
  });

  win.once("ready-to-show", () => win.show());

  // Open external links in the default browser, never inside the app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("http://localhost:5173") && !url.startsWith("file://")) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

ipcMain.on("set-theme", (event, theme) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  try {
    win.setTitleBarOverlay({
      color: theme === "dark" ? "#19191900" : "#ffffff00",
      symbolColor: theme === "dark" ? "#9b9a97" : "#787774",
      height: 44,
    });
  } catch {
    // setTitleBarOverlay is Windows-only; ignore elsewhere.
  }
});

// Single instance — a second launch focuses the existing window instead of
// spawning a second backend on the same port.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    if (!isDev) {
      let ok = false;
      try {
        ok = await startBackend();
      } catch (e) {
        log("backend error", e.message);
        dialog.showErrorBox(
          "Slate — could not start",
          "The local workspace engine failed to start.\n\n" + e.message
        );
        app.quit();
        return;
      }
      if (!ok) {
        dialog.showErrorBox(
          "Slate — could not start",
          "The local workspace engine did not start in time. Please relaunch Slate."
        );
        app.quit();
        return;
      }
    }
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", stopBackend);
process.on("exit", stopBackend);
