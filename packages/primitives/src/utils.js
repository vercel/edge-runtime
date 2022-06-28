const CONSTANTS = require('./constants')

/**
 * Allows to define an enumerable property with the given key and value for
 * the given object. If the property is not listed it will fail.
 */
function defineEnumerableProperty(obj, key, value) {
  if (!CONSTANTS.ENUMERABLE_PROPERTIES.includes(key)) {
    throw new Error(
      `Attempted to define '${key}' as unexistent enumerable property`
    )
  }

  return Object.defineProperty(obj, key, {
    configurable: false,
    enumerable: true,
    value: value,
    writable: true,
  })
}

/**
 * Allows to define a non-enumerable property with the given key and value
 * in the given object. If the key is not listed as a non-enumerable property
 * it will fail. This is done in order to allow iterating non-enumerable
 * properties from outside the package.
 */
function defineNonEnumerableProperty(obj, key, value) {
  if (!CONSTANTS.NON_ENUMERABLE_PROPERTIES.includes(key)) {
    throw new Error(
      `Attempted to define '${key}' as unexistent non enumerable property`
    )
  }

  return Object.defineProperty(obj, key, {
    configurable: false,
    enumerable: false,
    value: value,
    writable: true,
  })
}

function defineEnumerableProperties(obj, map) {
  for (const [key, value] of Object.entries(map)) {
    defineEnumerableProperty(obj, key, value)
  }
}

module.exports = {
  defineEnumerableProperties,
  defineEnumerableProperty,
  defineNonEnumerableProperty,
}
