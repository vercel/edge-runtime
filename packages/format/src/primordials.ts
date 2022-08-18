export const ReflectGetOwnPropertyDescriptor = Reflect.getOwnPropertyDescriptor

function GetOwnGetter(target: object, key: string) {
  const descriptor = ReflectGetOwnPropertyDescriptor(target, key)
  return descriptor ? descriptor.get : undefined
}

export const ReflectGetPrototypeOf = Reflect.getPrototypeOf
const TypedArray = ReflectGetPrototypeOf(Uint8Array)!

export const ArrayIsArray = Array.isArray
export const ArrayPrototypeFilter = Array.prototype.filter
export const ArrayPrototypePush = Array.prototype.push
export const DatePrototypeGetTime = Date.prototype.getTime
export const DatePrototypeToISOString = Date.prototype.toISOString
export const DatePrototypeToString = Date.prototype.toString
export const NumberIsNaN = Number.isNaN
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
