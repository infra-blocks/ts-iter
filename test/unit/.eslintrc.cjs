module.exports = {
    extends: "../../.eslintrc.cjs",
    rules: {
        // Useful to use async just to force a function to return a promise, or turn a generator into an async one.
        "@typescript-eslint/require-await": "off",
    },
};
