const { contextBridge, ipcRenderer, webFrame } = require("electron");

contextBridge.exposeInMainWorld("slate", {
  setTheme: (theme) => ipcRenderer.send("set-theme", theme),
  zoom: (delta) => {
    if (delta === 0) {
      webFrame.setZoomLevel(0);
    } else {
      const next = webFrame.getZoomLevel() + delta;
      webFrame.setZoomLevel(Math.max(-4, Math.min(4, next)));
    }
  },
});
