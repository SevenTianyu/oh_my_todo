const path = require("node:path");
const assert = require("node:assert/strict");
const test = require("node:test");

const {
  APP_HOST,
  APP_PROTOCOL,
  createAppUrl,
  getDistPath,
  resolveAppAssetPath
} = require("./desktopConfig.cjs");

test("uses a stable privileged app origin", () => {
  assert.equal(APP_PROTOCOL, "app");
  assert.equal(APP_HOST, "interview-workbench");
  assert.equal(createAppUrl(), "app://interview-workbench/");
  assert.equal(createAppUrl("/assets/index.js"), "app://interview-workbench/assets/index.js");
});

test("resolves production assets inside the Vite dist directory", () => {
  const distPath = path.join(path.sep, "tmp", "oh-my-todo-dist");

  assert.equal(getDistPath(path.join(path.sep, "repo")), path.join(path.sep, "repo", "dist"));
  assert.equal(
    resolveAppAssetPath("/assets/index.js", distPath),
    path.join(distPath, "assets", "index.js")
  );
  assert.equal(resolveAppAssetPath("/", distPath), path.join(distPath, "index.html"));
});

test("rejects protocol paths outside the dist directory", () => {
  assert.throws(
    () => resolveAppAssetPath("/../package.json", path.join(path.sep, "tmp", "dist")),
    /outside the app bundle/
  );
});
