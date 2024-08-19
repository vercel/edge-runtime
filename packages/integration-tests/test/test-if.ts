export const guard = <T extends { skip: T }>(
  t: T,
  conditional: boolean | (() => boolean),
): T =>
  (typeof conditional === 'function' ? conditional() : conditional) ? t : t.skip
export const aboveNode16 = () =>
  process.versions.node.split('.').map(Number)[0] > 16
export const isEdgeRuntime = () =>
  (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime !== undefined
