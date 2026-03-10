module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  plugins: ["@typescript-eslint"],
  extends: ["plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
  },
  // Electron main/preload are CommonJS — allow require() in those files
  overrides: [
    {
      files: ["main.js", "preload.js", "forge.config.js"],
      env: { node: true, browser: false },
      rules: {
        "@typescript-eslint/no-require-imports": "off",
      },
    },
  ],
};
