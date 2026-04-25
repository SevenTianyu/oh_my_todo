const { app, BrowserWindow, net, protocol } = require("electron");
const { pathToFileURL } = require("node:url");
const {
  APP_HOST,
  APP_PROTOCOL,
  createAppUrl,
  getDevServerUrl,
  getDistPath,
  resolveAppAssetPath
} = require("./desktopConfig.cjs");

const isDev = !app.isPackaged;

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_PROTOCOL,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

function registerProductionProtocol() {
  protocol.handle(APP_PROTOCOL, (request) => {
    const requestUrl = new URL(request.url);

    if (requestUrl.hostname !== APP_HOST) {
      return new Response("Not found", { status: 404 });
    }

    try {
      const assetPath = resolveAppAssetPath(requestUrl.pathname, getDistPath(app.getAppPath()));
      return net.fetch(pathToFileURL(assetPath).toString());
    } catch (error) {
      console.error(error);
      return new Response("Not found", { status: 404 });
    }
  });
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 960,
    minHeight: 700,
    title: "面试工作台",
    backgroundColor: "#f5efe3",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  if (isDev) {
    void mainWindow.loadURL(getDevServerUrl());
  } else {
    void mainWindow.loadURL(createAppUrl());
  }
}

app.whenReady().then(() => {
  if (!isDev) {
    registerProductionProtocol();
  }

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
