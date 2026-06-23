// @ts-check
const nextConfig = require('eslint-config-next/core-web-vitals')

module.exports = [
  ...nextConfig,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]
