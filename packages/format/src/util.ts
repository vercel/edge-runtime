import {
  ArrayIsArray,
  ObjectGetOwnPropertyDescriptors,
  ObjectPrototypeToString,
} from './primordials'

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
    isArray(object) || isTypedArray(object)
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

export function isArray(value: unknown): value is unknown[] {
  return ArrayIsArray(value)
}

export function isTypedArray(value: unknown): value is TypedArray {
  return (
    typeof value === 'object' &&
    typedArrayStrings.has(ObjectPrototypeToString.call(value))
  )
}
