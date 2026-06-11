const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

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

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
