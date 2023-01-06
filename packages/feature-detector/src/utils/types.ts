import { Type } from 'ts-morph'

/**
 * Extracts type nested inside a promise, or return the passed type if it has no generics
 */
export function extractFromPromise(type?: Type): Type | undefined {
  if (type?.getTypeArguments()?.length === 1) {
    return type.getTypeArguments()[0]
  }
  return type
}

/**
 * Indicates whether a given type is a subclass of another type (by its name)
 */
export function isSubClassOf(type: Type | undefined, typeName: string) {
  if (!type) {
    return false
  }
  for (const currentType of [type, ...type.getBaseTypes()]) {
    if (currentType.getText() === typeName) {
      return true
    }
  }
  return false
}
