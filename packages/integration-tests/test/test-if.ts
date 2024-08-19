export const guard = <T extends { skip: T }>(
  t: T,
  conditional: boolean | (() => boolean),
): T =>
  (typeof conditional === 'function' ? conditional() : conditional) ? t : t.skip

const aboveNode16 = () => process.versions.node.split('.').map(Number)[0] > 16

export const isEdgeRuntime = () =>
  (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime !== undefined

/**
 * Returns true if the block should execute for a Node.js version
 * that supports the APIs natively, or in an Edge Runtime running
 * in a Node.js version that supports it.
 *
 * For instance, {@link Headers} is not available in Node.js 16.x,
 * but when running in an Edge Runtime context within Node.js 16,
 * Headers _is_ available.
 *
 * Therefore, `polyfilledOrNative` will return `true` in
 * Node.js 18.x and above, and in Edge Runtime running in Node.js 16.x
 * and above.
 */
export const polyfilledOrNative = () => isEdgeRuntime() || aboveNode16()
