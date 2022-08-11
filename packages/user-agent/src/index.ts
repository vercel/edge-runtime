import parseua from 'ua-parser-js'

export interface UserAgent {
  isBot: boolean
  ua: string
  browser: {
    name?: string
    version?: string
  }
  device: {
    model?: string
    type?: string
    vendor?: string
  }
  engine: {
    name?: string
    version?: string
  }
  os: {
    name?: string
    version?: string
  }
  cpu: {
    architecture?: string
  }
}

export function isBot(input: string): boolean {
  return /Googlebot|Mediapartners-Google|AdsBot-Google|googleweblight|Storebot-Google|Google-PageRenderer|Bingbot|BingPreview|Slurp|DuckDuckBot|baiduspider|yandex|sogou|LinkedInBot|bitlybot|tumblr|vkShare|quora link preview|facebookexternalhit|facebookcatalog|Twitterbot|applebot|redditbot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|ia_archiver/i.test(
    input
  )
}

export function userAgentFromString(input: string | undefined): UserAgent {
  return {
    ...parseua(input),
    isBot: input === undefined ? false : isBot(input),
  }
}

type HeaderLike = { get(key: string): string | null | undefined }
export function userAgent(request?: { headers: HeaderLike }): UserAgent {
  return userAgentFromString(request?.headers?.get('user-agent') || undefined)
}
