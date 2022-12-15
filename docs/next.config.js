const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.js',
  flexsearch: {
    codeblocks: false,
  },
  unstable_staticImage: true,
  defaultShowCopyCode: true,
})

module.exports = withNextra({
  reactStrictMode: true,
})
