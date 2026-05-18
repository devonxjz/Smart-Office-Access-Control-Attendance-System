import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'src/components/ui/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',       // hạ từ error xuống warn
      '@typescript-eslint/no-unused-vars': 'warn',        // hạ từ error xuống warn
      'react-refresh/only-export-components': 'warn',     // hạ từ error xuống warn
      'react-hooks/set-state-in-effect': 'warn',          // hạ từ error xuống warn
      'prefer-const': 'warn',                             // hạ từ error xuống warn
    },
  },
])
