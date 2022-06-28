import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'

const useDark = () => {
  const { resolvedTheme } = useTheme()
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    setIsDark(resolvedTheme === 'dark')
    return () => false
  }, [resolvedTheme])
  return isDark
}

const theme = {
  github: 'https://github.com/vercel/edge-runtime',
  projectLink: 'https://github.com/vercel/edge-runtime',
  docsRepositoryBase:
    'https://github.com/vercel/edge-runtime/blob/main/docs/pages',
  titleSuffix: ' | Edge Runtime',
  search: true,
  unstable_flexsearch: true,
  unstable_staticImage: true,
  floatTOC: true,
  font: false,
  feedbackLink: 'Question? Give us feedback →',
  logo: function Logo() {
    const isDark = useDark()
    return (
      <>
        <img
          width='24'
          src={`/logo${isDark ? '-dark' : ''}.svg`}
          alt='Edge Runtime logo'
        />
        <span className='w-full font-bold pl-2'>Edge Runtime</span>
      </>
    )
  },
  head: function Head({ title, meta }) {
    const router = useRouter()
    const isDark = useDark()

    return (
      <>
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
        <link
          rel='icon'
          href={`/logo${isDark ? '-dark' : ''}.svg`}
          type='image/svg+xml'
        />
        <meta name='twitter:card' content='summary_large_image' />
        <meta property='og:type' content='website' />
        <meta name='og:title' content={title} />
        <meta name='og:description' content={meta.description} />
        <meta
          property='og:url'
          content={`https://edge-runtime.vercel.app${router.asPath}`}
        />
        <meta
          property='og:image'
          content={`https://edge-runtime.vercel.app${
            meta.ogImage ?? '/og-image.png'
          }`}
        />
        <meta property='og:site_name' content='Edge Runtime' />
      </>
    )
  },
  footerEditLink: () => {
    return 'Edit this page on GitHub'
  },
}
export default theme
