module.exports = {
  root: true, // don't cascade into the repo root's frontend-oriented .eslintrc.js
  env: {
    node: true,
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script'
  },
  extends: ['eslint:recommended'],
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^next$', ignoreRestSiblings: true }],
    'no-undef': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    eqeqeq: ['error', 'always']
  }
};
