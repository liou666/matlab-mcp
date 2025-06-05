import defineConfig from '@liou666/eslint-config-flat'

export default defineConfig({
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'n/no-unsupported-features/node-builtins': 'off',
    'react/jsx-indent': ['off'],
  },
})
