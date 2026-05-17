'use strict';

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules', 'coverage', 'src/scripts'] },
  {
    files: ['src/**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        // catch (error) / catch (e) / catch (err) — intentional swallowing is fine
        caughtErrorsIgnorePattern: '^(_|error$|err$|e$)',
      }],
      'no-console': 'off',
    },
  },
];
