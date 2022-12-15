import type { InspectOptions } from 'util'
import type { TypedArray } from './primordials'

import {
  ArrayPrototypeFilter,
  ArrayPrototypePush,
  DatePrototypeGetTime,
  DatePrototypeToISOString,
  getConstructorName,
  getOwnNonIndexProperties,
  getPrefix,
  isTypedArray,
  kind,
  MapPrototypeGetSize,
  ObjectGetOwnPropertyNames,
  ObjectGetOwnPropertySymbols,
  ObjectKeys,
  ObjectPrototypePropertyIsEnumerable,
  PropertyFilter,
  SetPrototypeGetSize,
  StringPrototypeIncludes,
  SymbolIterator,
  SymbolPrototypeToString,
  TypedArrayPrototypeGetLength,
} from './primordials'

interface Context {
  circular?: Map<unknown, number>
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
        return format(firstArg[customInspectSymbol]({ format }))
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
          if (hasCustomSymbol(arg, customInspectSymbol)) {
            return format(arg[customInspectSymbol]({ format }))
          } else if (isDate(arg) || isError(arg) || kind(arg, 'bigint')) {
            return format(arg)
          } else {
            return String(arg)
          }
        }
        case '%j':
          return safeStringify(args[index++])
        case '%d': {
          const arg = args[index++]
          if (kind(arg, 'bigint')) {
            return format(arg)
          } else {
            return String(Number(arg))
          }
        }
        case '%O':
          return inspect(args[index++], { customInspectSymbol })
        case '%o':
          return inspect(args[index++], {
            customInspectSymbol,
            showHidden: true,
            depth: 4,
          })
        case '%i': {
          const arg = args[index++]
          if (kind(arg, 'bigint')) {
            return format(arg)
          } else {
            return String(parseInt(arg as any, 10))
          }
        }
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
      return format(value[customInspectSymbol]({ format }))
    }

    const formattedPrimitive = formatPrimitive(value)
    if (formattedPrimitive !== undefined) {
      return formattedPrimitive
    }

    // Using an array here is actually better for the average case than using
    // a Set. `seen` will only check for the depth and will never grow too large.
    if (ctx.seen.includes(value)) {
      let index: number | undefined = 1
      if (ctx.circular === undefined) {
        ctx.circular = new Map()
        ctx.circular.set(value, index)
      } else {
        index = ctx.circular.get(value)
        if (index === undefined) {
          index = ctx.circular.size + 1
          ctx.circular.set(value, index)
        }
      }
      return `[Circular *${index}]`
    }

    return formatRaw(ctx, value, recurseTimes)
  }

  function formatRaw(
    ctx: Context,
    value: unknown,
    recurseTimes: number | null | undefined
  ): string {
    let keys: Array<string | symbol> = []

    const constructor = getConstructorName(value as object)
    let base = ''
    let formatter: (
      ctx: Context,
      value: any,
      recurseTimes: number | null | undefined,
      visibleKeys: Set<string | symbol>,
      keys: Array<string | symbol>
    ) => string[] = () => []
    let braces: [string, string] = ['', '']
    let noIterator = true
    const filter = ctx.showHidden
      ? PropertyFilter.ALL_PROPERTIES
      : PropertyFilter.ONLY_ENUMERABLE

    if (SymbolIterator in (value as object)) {
      noIterator = false

      if (Array.isArray(value)) {
        // Only set the constructor for non ordinary ("Array [...]") arrays.
        const prefix =
          constructor !== 'Array'
            ? getPrefix(constructor, `(${value.length})`)
            : ''
        keys = getOwnNonIndexProperties(value, filter)
        braces = [`${prefix}[`, ']']
        if (value.length === 0 && keys.length === 0) {
          return `${braces[0]}]`
        }
        formatter = formatArray
      } else if (isSet(value)) {
        const size = SetPrototypeGetSize.call(value)
        const prefix = getPrefix(constructor, `(${size})`)
        keys = getKeys(value, ctx.showHidden)
        formatter = formatSet
        if (size === 0 && keys.length === 0) {
          return `${prefix}{}`
        }
        braces = [`${prefix}{`, '}']
      } else if (isMap(value)) {
        const size = MapPrototypeGetSize.call(value)
        const prefix = getPrefix(constructor, `(${size})`)
        keys = getKeys(value, ctx.showHidden)
        formatter = formatMap
        if (size === 0 && keys.length === 0) {
          return `${prefix}{}`
        }
        braces = [`${prefix}{`, '}']
      } else if (isTypedArray(value)) {
        keys = getOwnNonIndexProperties(value, filter)
        const size = TypedArrayPrototypeGetLength.call(value)
        const prefix = getPrefix(constructor, `(${size})`)
        braces = [`${prefix}[`, ']']
        if (value.length === 0 && keys.length === 0) return `${braces[0]}]`
        formatter = formatTypedArray.bind(null, size)
      } else {
        noIterator = true
      }
    }

    if (noIterator) {
      keys = getKeys(value as object, ctx.showHidden)
      braces = ['{', '}']

      if (constructor === undefined) {
        if (keys.length === 0) {
          return `[Object: null prototype] {}`
        }
      } else if (constructor === 'Object') {
        if (keys.length === 0) {
          return `{}`
        }
      } else if (kind(value, 'function')) {
        base = `[Function${value.name ? ': ' + value.name : ''}]`
        if (keys.length === 0) {
          return base
        }
      } else if (isRegExp(value)) {
        base = RegExp.prototype.toString.call(value)
        if (keys.length === 0) {
          return base
        }
        base = ' ' + base
      } else if (isDate(value)) {
        base = Number.isNaN(DatePrototypeGetTime.call(value))
          ? Date.prototype.toString.call(value)
          : DatePrototypeToISOString.call(value)
        if (keys.length === 0) {
          return base
        }
        base = ' ' + base
      } else if (isError(value)) {
        base = formatError(value)
        if (keys.length === 0) {
          return base
        }
        base = ' ' + base
      } else if (hasCustomSymbol(value, ctx.customInspectSymbol)) {
        base = format(value[ctx.customInspectSymbol]({ format }))
        if (keys.length === 0) {
          return base
        }
        base = ' ' + base
      } else {
        braces[0] = `${getPrefix(constructor)}{`
      }
    }

    if (recurseTimes && recurseTimes < 0) {
      return isRegExp(value)
        ? RegExp.prototype.toString.call(value)
        : '[Object]'
    }

    ctx.seen.push(value)
    const visibleKeys = new Set<string | symbol>(keys)

    const output = formatter(ctx, value, recurseTimes, visibleKeys, keys)
    for (let i = 0; i < keys.length; i++) {
      output.push(
        formatProperty(
          ctx,
          value as object,
          recurseTimes,
          visibleKeys,
          keys[i],
          false
        )
      )
    }

    if (ctx.circular !== undefined) {
      const index = ctx.circular.get(value)
      if (index !== undefined) {
        const reference = `<ref *${index}>`
        // Add reference always to the very beginning of the output.
        base = base === '' ? reference : `${reference} ${base}`
      }
    }
    ctx.seen.pop()

    return reduceToSingleString(output, base, braces)
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
    visibleKeys: Set<string | symbol>,
    key: string | symbol,
    isArray: boolean
  ) {
    let name: string | undefined
    let str: string | undefined

    const desc = Object.getOwnPropertyDescriptor(value, key) || {
      value: value[key as keyof typeof value],
    }
    if (desc.value !== undefined) {
      str = formatValue(ctx, desc.value, recurseTimes)
    } else if (desc.get) {
      str = desc.set ? '[Getter/Setter]' : '[Getter]'
    } else if (desc.set) {
      str = '[Setter]'
    } else {
      str = 'undefined'
    }

    if (isArray) {
      return str
    }

    if (kind(key, 'symbol')) {
      name = `[${SymbolPrototypeToString.call(key)}]`
    } else if (!visibleKeys.has(key)) {
      name = '[' + key + ']'
    } else {
      name = key
    }

    return `${name}: ${str}`
  }

  function formatArray(
    ctx: Context,
    value: unknown[],
    recurseTimes: number | null | undefined,
    visibleKeys: Set<string | symbol>
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

    return output
  }

  function formatTypedArray(
    length: number,
    ctx: Context,
    value: TypedArray,
    recurseTimes: number | null | undefined
  ) {
    const output = new Array(length)
    for (let i = 0; i < length; ++i) {
      output[i] =
        value.length > 0 && kind(value[0], 'number')
          ? String(value[i])
          : formatBigInt(value[i] as any as bigint)
    }
    if (ctx.showHidden) {
      // .buffer goes last, it's not a primitive like the others.
      // All besides `BYTES_PER_ELEMENT` are actually getters.
      for (const key of [
        'BYTES_PER_ELEMENT',
        'length',
        'byteLength',
        'byteOffset',
        'buffer',
      ] as Array<keyof TypedArray>) {
        const str = formatValue(ctx, value[key], recurseTimes)
        ArrayPrototypePush.call(output, `[${String(key)}]: ${str}`)
      }
    }
    return output
  }

  function formatSet(
    ctx: Context,
    value: Set<unknown>,
    recurseTimes: number | null | undefined
  ) {
    const output: string[] = []
    for (const v of value) {
      ArrayPrototypePush.call(output, formatValue(ctx, v, recurseTimes))
    }
    return output
  }

  function formatMap(
    ctx: Context,
    value: Map<unknown, unknown>,
    recurseTimes: number | null | undefined
  ) {
    const output: string[] = []
    for (const { 0: k, 1: v } of value) {
      output.push(
        `${formatValue(ctx, k, recurseTimes)} => ${formatValue(
          ctx,
          v,
          recurseTimes
        )}`
      )
    }
    return output
  }

  return format
}

const formatBigInt = (bigint: bigint) => `${bigint}n`

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
  if (kind(value, 'bigint')) return formatBigInt(value)
  if (kind(value, 'symbol')) return value.toString()
}

function hasCustomSymbol<CustomSymbol extends symbol>(
  value: unknown,
  customInspectSymbol: CustomSymbol
): value is Record<
  CustomSymbol,
  (options: { format: (...args: unknown[]) => string }) => unknown
> {
  return (
    value !== null &&
    kind(value, 'object') &&
    customInspectSymbol in value &&
    kind(value[customInspectSymbol], 'function')
  )
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

function isMap(value: unknown): value is Map<unknown, unknown> {
  return (
    kind(value, 'object') &&
    Object.prototype.toString.call(value) === '[object Map]'
  )
}

function isSet(value: unknown): value is Map<unknown, unknown> {
  return (
    kind(value, 'object') &&
    Object.prototype.toString.call(value) === '[object Set]'
  )
}

function isBelowBreakLength(
  output: string[],
  start: number,
  base: string
): boolean {
  const breakLength = 80
  // Each entry is separated by at least a comma. Thus, we start with a total
  // length of at least `output.length`. In addition, some cases have a
  // whitespace in-between each other that is added to the total as well.
  // TODO(BridgeAR): Add unicode support. Use the readline getStringWidth
  // function. Check the performance overhead and make it an opt-in in case it's
  // significant.
  let totalLength = output.length + start
  if (totalLength + output.length > breakLength) {
    return false
  }
  for (let i = 0; i < output.length; i++) {
    totalLength += output[i].length
    if (totalLength > breakLength) {
      return false
    }
  }
  // Do not line up properties on the same line if `base` contains line breaks.
  return base === '' || !StringPrototypeIncludes.call(base, '\n')
}

function reduceToSingleString(
  output: string[],
  base: string,
  braces: string[]
) {
  const start = output.length + braces[0].length + base.length + 10
  if (!isBelowBreakLength(output, start, base)) {
    return (
      (base ? base + ' ' : '') +
      braces[0] +
      '\n  ' +
      output.join(',\n  ') +
      '\n' +
      braces[1]
    )
  }

  return (
    (base ? base + ' ' : '') +
    braces[0] +
    ' ' +
    output.join(', ') +
    ' ' +
    braces[1]
  ).trim()
}

function safeStringify(input: unknown) {
  if (Array.isArray(input)) {
    input = input.map((element) =>
      JSON.parse(JSON.stringify(element, makeCircularReplacer()))
    )
  }
  return JSON.stringify(input, makeCircularReplacer())
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

// Look up the keys of the object.
function getKeys(
  value: object,
  showHidden: boolean = false
): Array<string | symbol> {
  let keys: Array<string | symbol>

  const symbols = ObjectGetOwnPropertySymbols(value)
  if (showHidden) {
    keys = ObjectGetOwnPropertyNames(value)
    if (symbols.length !== 0) ArrayPrototypePush.apply(keys, symbols)
  } else {
    // This might throw if `value` is a Module Namespace Object from an
    // unevaluated module, but we don't want to perform the actual type
    // check because it's expensive.
    // TODO(devsnek): track https://github.com/tc39/ecma262/issues/1209
    // and modify this logic as needed.
    try {
      keys = ObjectKeys(value)
    } catch (err: unknown) {
      keys = ObjectGetOwnPropertyNames(value)
    }
    if (symbols.length !== 0) {
      const filter = (key: symbol) =>
        ObjectPrototypePropertyIsEnumerable.call(value, key)
      ArrayPrototypePush.apply(keys, ArrayPrototypeFilter.call(symbols, filter))
    }
  }
  return keys
}
