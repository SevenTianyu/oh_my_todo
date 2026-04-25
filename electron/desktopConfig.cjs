const path = require("node:path");

const APP_PROTOCOL = "app";
const APP_HOST = "interview-workbench";
const DEFAULT_DEV_SERVER_URL = "http://127.0.0.1:5173";

function getDevServerUrl(env = process.env) {
  return env.VITE_DEV_SERVER_URL || DEFAULT_DEV_SERVER_URL;
}

function getDistPath(appPath = process.cwd()) {
  return path.join(appPath, "dist");
}

function createAppUrl(assetPath = "/") {
  const normalizedPath = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  return `${APP_PROTOCOL}://${APP_HOST}${normalizedPath}`;
}

function resolveAppAssetPath(requestPath, distPath) {
  const decodedPath = decodeURIComponent(requestPath || "/");
  const relativeAssetPath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const rootPath = path.resolve(distPath);
  const assetPath = path.resolve(rootPath, relativeAssetPath);
  const relativeToRoot = path.relative(rootPath, assetPath);

  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error(`Refusing to serve ${requestPath} outside the app bundle`);
  }

  return assetPath;
}

module.exports = {
  APP_HOST,
  APP_PROTOCOL,
  DEFAULT_DEV_SERVER_URL,
  createAppUrl,
  getDevServerUrl,
  getDistPath,
  resolveAppAssetPath
};
