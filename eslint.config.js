import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/', '.astro/', 'node_modules/', 'scripts/'],
  },
];
