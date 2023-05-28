/**
 * Injects the source code of a file into a string.
 * This relies on the build script to generate a file with the same name as the
 * file to be injected, but with a `.text.js` extension.
 */
declare const injectSourceCode: (path: string) => string
