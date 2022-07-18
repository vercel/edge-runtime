import type { Dictionary } from './types'
import type { Context } from 'vm'
import { readFileSync } from 'fs'
import { runInContext } from 'vm'
import { dirname } from 'path'

/**
 * Allows to require a series of dependencies provided by their path
 * into a provided module context. It fills and accepts a require
 * cache to ensure each module is loaded once.
 */
export function requireDependencies(params: {
  context: Context
  requireCache: Map<string, Dictionary>
  dependencies: Array<{
    mapExports: { [key: string]: string }
    path: string
  }>
}): void {
  const { context, requireCache, dependencies } = params
  const requireFn = createRequire(context, requireCache)
  for (const { path, mapExports } of dependencies) {
    const mod = requireFn(path, path)
    for (const mapKey of Object.keys(mapExports)) {
      context[mapExports[mapKey]] = mod[mapKey]
    }
  }
}

export function createRequire(
  context: Context,
  cache: Map<string, any>,
  references?: Set<string>,
  scopedContext: Record<any, any> = {}
) {
  return function requireFn(referrer: string, specifier: string) {
    const resolved = require.resolve(specifier, {
      paths: [dirname(referrer)],
    })

    const cached = cache.get(specifier) || cache.get(resolved)
    if (cached !== undefined && cached !== null) {
      return cached.exports
    }

    const module = {
      exports: {},
      loaded: false,
      id: resolved,
    }

    cache.set(resolved, module)
    references?.add(resolved)
    const fn = runInContext(
      `(function(module,exports,require,__dirname,__filename,${Object.keys(
        scopedContext
      ).join(',')}) {${readFileSync(resolved, 'utf-8')}\n})`,
      context
    )

    try {
      fn(
        module,
        module.exports,
        requireFn.bind(null, resolved),
        dirname(resolved),
        resolved,
        ...Object.values(scopedContext)
      )
    } catch (error) {
      cache.delete(resolved)
      throw error
    }
    module.loaded = true
    return module.exports
  }
}

export function requireWithCache(params: {
  cache?: Map<string, any>
  context: Context
  path: string
  references?: Set<string>
  scopedContext?: Record<string, any>
}) {
  return createRequire(
    params.context,
    params.cache ?? new Map(),
    params.references,
    params.scopedContext
  ).call(null, params.path, params.path)
}
