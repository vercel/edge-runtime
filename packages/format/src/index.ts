import { InspectOptions } from 'util'

interface Context {
  seen: unknown[]
  showHidden?: boolean
  depth?: number | null | undefined
  customInspectSymbol: symbol
}

interface FormatterOptions {
  formatError?: (error: Error) => string
  customInspectSymbol?: symbol
}

export function createFormat(opts: FormatterOptions = {}) {
  if (opts.customInspectSymbol === undefined) {
    opts.customInspectSymbol = Symbol.for('edge-runtime.inspect.custom')
  }

  if (opts.formatError === undefined) {
    opts.formatError = (error: Error) =>
      `[${Error.prototype.toString.call(error)}]`
  }

  const { formatError, customInspectSymbol } = opts

  function format(...args: unknown[]): string {
    const [firstArg] = args

    if (!kind(firstArg, 'string')) {
      if (hasCustomSymbol(firstArg, customInspectSymbol)) {
        return format(firstArg[customInspectSymbol]())
      } else {
        return args
          .map((item) => inspect(item, { customInspectSymbol }))
          .join(' ')
      }
    }

    let index = 1
    let str = String(firstArg).replace(/%[sjdOoif%]/g, (token) => {
      if (token === '%%') return '%'
      if (index >= args.length) return token
      switch (token) {
        case '%s': {
          const arg = args[index++]
          return hasCustomSymbol(arg, customInspectSymbol)
            ? format(arg[customInspectSymbol]())
            : String(arg)
        }
        case '%j':
          return safeStringify(args[index++])
        case '%d':
          return String(Number(args[index++]))
        case '%O':
          return inspect(args[index++], { customInspectSymbol })
        case '%o':
          return inspect(args[index++], {
            customInspectSymbol,
            showHidden: true,
            depth: 4,
          })
        case '%i':
          return String(parseInt(args[index++] as any, 10))
        case '%f':
          return String(parseFloat(args[index++] as any))
        default:
          return token
      }
    })

    for (let arg = args[index]; index < args.length; arg = args[++index]) {
      if (arg === null || !kind(arg, 'object')) {
        str += ' ' + arg
      } else {
        str += ' ' + inspect(arg)
      }
    }

    return str
  }

  function formatValue(
    ctx: Context,
    value: unknown,
    recurseTimes: number | null | undefined
  ): string {
    if (hasCustomSymbol(value, customInspectSymbol)) {
      return format(value[customInspectSymbol]())
    }

    const formattedPrimitive = formatPrimitive(value)
    if (formattedPrimitive !== undefined) {
      return formattedPrimitive
    }

    const symbols = Object.getOwnPropertySymbols(value)
    if (symbols.length > 0) {
      symbols.forEach((symbol) => {
        const obj = value as Record<symbol | string, unknown>
        const symbolKey = `[${symbol.toString()}]`
        obj[symbolKey] = obj[symbol]
        delete obj[symbol]
      })
    }

    const keys = ctx.showHidden
      ? Object.getOwnPropertyNames(value)
      : Object.keys(value as object)
    const visibleKeys = new Set<string>()
    keys.forEach((key) => visibleKeys.add(key))

    if (keys.length === 0) {
      if (kind(value, 'function')) {
        return `[Function${value.name ? ': ' + value.name : ''}]`
      } else if (isRegExp(value)) {
        return RegExp.prototype.toString.call(value)
      } else if (isDate(value)) {
        return Date.prototype.toString.call(value)
      } else if (isError(value)) {
        return formatError(value)
      } else if (hasCustomSymbol(value, ctx.customInspectSymbol)) {
        return format(value[ctx.customInspectSymbol]())
      }
    }

    const isValueFunction = kind(value, 'function')
    const isValueArray = Array.isArray(value)
    let base = ''

    if (isValueFunction) {
      base = `[Function${value.name ? ': ' + value.name : ''}]`
    } else if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value)
    } else if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value)
    } else if (isError(value)) {
      base = ' ' + formatError(value)
    } else if (hasCustomSymbol(value, ctx.customInspectSymbol)) {
      base = ' ' + value[ctx.customInspectSymbol]()
    }

    const braces = isValueArray
      ? ['[', ']']
      : isValueFunction
      ? ['', '']
      : ['{', '}']

    if (keys.length === 0 && (!isValueArray || value.length === 0)) {
      return braces[0] + base + braces[1]
    }

    if (recurseTimes && recurseTimes < 0) {
      return isRegExp(value)
        ? RegExp.prototype.toString.call(value)
        : '[Object]'
    }

    ctx.seen.push(value)

    let output = isValueArray
      ? formatArray(ctx, value, recurseTimes, visibleKeys, keys)
      : keys.map((key) =>
          formatProperty(
            ctx,
            value as object,
            recurseTimes,
            visibleKeys,
            key,
            false
          )
        )

    ctx.seen.pop()

    return reduceToSingleString(output, base, braces, isValueFunction)
  }

  function inspect(
    value: unknown,
    opts?: InspectOptions & { customInspectSymbol: symbol }
  ) {
    opts = Object.assign({ seen: [], depth: 2 }, opts)
    return formatValue(opts as Context, value, opts.depth)
  }

  function formatProperty(
    ctx: Context,
    value: object,
    recurseTimes: number | null | undefined,
    visibleKeys: Set<string>,
    key: string,
    isArray: boolean
  ) {
    let name: string | undefined
    let str: string | undefined

    const desc = Object.getOwnPropertyDescriptor(value, key) || {
      value: value[key as keyof typeof value],
    }
    if (desc.get) {
      str = desc.set ? '[Getter/Setter]' : '[Getter]'
    } else if (desc.set) {
      str = '[Setter]'
    }

    if (!visibleKeys.has(key)) {
      name = '[' + key + ']'
    }

    if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
        str = formatValue(
          ctx,
          desc.value,
          recurseTimes === null || recurseTimes === undefined
            ? null
            : recurseTimes - 1
        )

        if (str.indexOf('\n') > -1) {
          if (isArray) {
            str = str
              .split('\n')
              .map((line) => `  ${line}`)
              .join('\n')
              .slice(2)
          } else {
            str =
              '\n' +
              str
                .split('\n')
                .map((line) => `   ${line}`)
                .join('\n')
          }
        }
      } else {
        str = '[Circular]'
      }
    }

    if (name === undefined) {
      if (isArray && key.match(/^\d+$/)) {
        return str
      }
    }

    return `${key}: ${str}`
  }

  function formatArray(
    ctx: Context,
    value: unknown[],
    recurseTimes: number | null | undefined,
    visibleKeys: Set<string>,
    keys: string[]
  ) {
    const output: string[] = []

    for (let index = 0; index < value.length; ++index) {
      if (Object.prototype.hasOwnProperty.call(value, String(index))) {
        output.push(
          formatProperty(
            ctx,
            value as object,
            recurseTimes,
            visibleKeys,
            String(index),
            true
          )
        )
      } else {
        output.push('')
      }
    }

    keys.forEach((key) => {
      if (!key.match(/^\d+$/)) {
        output.push(
          formatProperty(ctx, value, recurseTimes, visibleKeys, key, true)
        )
      }
    })

    return output
  }

  return format
}

function formatPrimitive(value: unknown) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (kind(value, 'string')) {
    return `'${JSON.stringify(value)
      .replace(/^"|"$/g, '')
      .replace(/'/g, "\\'")
      .replace(/\\"/g, '"')}'`
  }
  if (kind(value, 'boolean')) return '' + value
  if (kind(value, 'number')) return '' + value
  if (kind(value, 'bigint')) return '' + value
  if (kind(value, 'symbol')) return value.toString()
}

function hasCustomSymbol<CustomSymbol extends symbol>(
  value: unknown,
  customInspectSymbol: CustomSymbol
): value is Record<CustomSymbol, () => unknown> {
  return (
    value !== null &&
    kind(value, 'object') &&
    customInspectSymbol in value &&
    kind(value[customInspectSymbol], 'function')
  )
}

function kind(value: unknown, type: 'bigint'): value is bigint
function kind(value: unknown, type: 'boolean'): value is boolean
function kind(value: unknown, type: 'function'): value is Function
function kind(value: unknown, type: 'number'): value is number
function kind(value: unknown, type: 'string'): value is string
function kind(value: unknown, type: 'symbol'): value is symbol
function kind(
  value: unknown,
  type: 'object'
): value is Record<string | number | symbol, unknown>
function kind(value: unknown, type: string): value is unknown {
  return typeof value === type
}

function isRegExp(value: unknown): value is RegExp {
  return (
    kind(value, 'object') &&
    Object.prototype.toString.call(value) === '[object RegExp]'
  )
}

function isDate(value: unknown): value is Date {
  return (
    kind(value, 'object') &&
    Object.prototype.toString.call(value) === '[object Date]'
  )
}

function isError(value: unknown): value is Error {
  return (
    kind(value, 'object') &&
    (Object.prototype.toString.call(value) === '[object Error]' ||
      value instanceof Error)
  )
}

function reduceToSingleString(
  output: string[],
  base: string,
  braces: string[],
  isValueFunction: boolean
) {
  const length = output.reduce((prev, cur) => {
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1
  }, 0)

  if (length > 60) {
    const prefix = isValueFunction ? ' {' : ''
    const suffix = isValueFunction ? '\n}' : ' '

    return (
      braces[0] +
      (base === '' ? '' : base + prefix + '\n ') +
      ' ' +
      `${output.join(',\n  ')}` +
      suffix +
      braces[1]
    )
  }

  const prefix = isValueFunction ? ' { ' : ' '
  const suffix = isValueFunction ? ' } ' : ' '

  return (
    braces[0] +
    base +
    prefix +
    output.join(', ') +
    suffix +
    braces[1]
  ).trim()
}

function safeStringify(object: unknown) {
  if (Array.isArray(object)) {
    object = object.map((element) =>
      JSON.parse(JSON.stringify(element, makeCircularReplacer()))
    )
  }

  return JSON.stringify(object, makeCircularReplacer())
}

function makeCircularReplacer() {
  const seen = new WeakSet()
  return (key: unknown, value: unknown) => {
    if (value !== null && kind(value, 'object')) {
      if (seen.has(value)) return '[Circular]'
      seen.add(value)
    }
    return value
  }
}
