/**
 * Make a pretty-printed version of object entries with a custom class name.
 * This is handy because both RequestCookies and ResponseCookies need to have a
 * human-readable version when a user `console.log`s them, and we want to make
 * it appear as a simple class instance with values that make sense.
 *
 * This will allow to print them as `[className] { [key]: [value] }`
 */
export function format(
  entries: Iterable<[any, any]>,
  className: string
): unknown {
  const object = Object.fromEntries(entries)
  Object.defineProperty(object, 'constructor', {
    value: { name: className },
    enumerable: false,
  })

  return object
}
