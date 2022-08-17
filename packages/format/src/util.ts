import isTypedArray from 'is-typed-array'
import { ArrayIsArray, ObjectGetOwnPropertyDescriptors } from './primordials'

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
