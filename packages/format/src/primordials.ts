export const ReflectGetOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor

function GetOwnGetter(target: object, key: string) {
  const descriptor = ReflectGetOwnPropertyDescriptor(target, key)
  return descriptor ? descriptor.get : undefined
}

export const ReflectGetPrototypeOf = Reflect.getPrototypeOf
const TypedArray = ReflectGetPrototypeOf(Uint8Array)!

export const ArrayPrototypeFilter = Array.prototype.filter
export const ArrayPrototypePush = Array.prototype.push
export const DatePrototypeGetTime = Date.prototype.getTime
export const DatePrototypeToISOString = Date.prototype.toISOString
export const ObjectGetOwnPropertyDescriptors = Object.getOwnPropertyDescriptors
export const ObjectGetOwnPropertyNames = Object.getOwnPropertyNames
export const ObjectGetOwnPropertySymbols = Object.getOwnPropertySymbols
export const ObjectKeys = Object.keys
export const ObjectPrototypePropertyIsEnumerable =
  Object.prototype.propertyIsEnumerable
export const ObjectPrototypeToString = Object.prototype.toString
export const MapPrototypeGetSize = GetOwnGetter(Map.prototype, 'size')!
export const SetPrototypeGetSize = GetOwnGetter(Set.prototype, 'size')!
export const StringPrototypeIncludes = String.prototype.includes
export const SymbolIterator = Symbol.iterator
export const SymbolPrototypeToString = Symbol.prototype.toString
export const TypedArrayPrototypeGetLength = GetOwnGetter(
  (TypedArray as any).prototype,
  'length'
)!

export type TypedArray =
  | BigInt64Array
  | BigUint64Array
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array

const typedArrayStrings = new Set([
  '[object BigInt64Array]',
  '[object BigUint64Array]',
  '[object Float32Array]',
  '[object Float64Array]',
  '[object Int8Array]',
  '[object Int16Array]',
  '[object Int32Array]',
  '[object Uint8Array]',
  '[object Uint8ClampedArray]',
  '[object Uint16Array]',
  '[object Uint32Array]',
])

export const enum PropertyFilter {
  ALL_PROPERTIES = 0,
  ONLY_ENUMERABLE = 1,
}

export function getOwnNonIndexProperties(
  object: object,
  filter: PropertyFilter
): Array<string | symbol> {
  const indexes =
    Array.isArray(object) || isTypedArray(object)
      ? new Set([...object.keys()].map((v) => v.toString()))
      : undefined
  return Object.entries(ObjectGetOwnPropertyDescriptors(object))
    .filter(([key, desc]) => {
      if (indexes && indexes.has(key)) {
        return false
      }

      if (filter === PropertyFilter.ONLY_ENUMERABLE && !desc.enumerable) {
        return false
      }

      return true
    })
    .map(([key]) => key)
}

export const isTypedArray = (value: unknown): value is TypedArray =>
  kind(value, 'object') &&
  typedArrayStrings.has(ObjectPrototypeToString.call(value))

export function kind(value: unknown, type: 'bigint'): value is bigint
export function kind(value: unknown, type: 'boolean'): value is boolean
export function kind(value: unknown, type: 'function'): value is Function
export function kind(value: unknown, type: 'number'): value is number
export function kind(value: unknown, type: 'string'): value is string
export function kind(value: unknown, type: 'symbol'): value is symbol
export function kind(
  value: unknown,
  type: 'object'
): value is Record<string | number | symbol, unknown>
export function kind(value: unknown, type: string): value is unknown {
  return typeof value === type
}

export const getConstructorName = (object: object): string | undefined =>
  object.constructor?.name

export const getPrefix = (constructor: string = '', size = '') =>
  `${constructor}${size} `
