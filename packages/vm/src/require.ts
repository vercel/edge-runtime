import type { Context } from 'vm'
import { readFileSync } from 'fs'
import { runInContext } from 'vm'
import { dirname } from 'path'
import Module from 'module'

/**
 * Allows to require a series of dependencies provided by their path
 * into a provided module context. It fills and accepts a require
 * cache to ensure each module is loaded once.
 */
export function requireDependencies(params: {
  context: Context
  requireCache: Map<string, Record<string | number, any>>
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

export function requireWithFakeGlobalScope(params: {
  context: Context
  cache?: Map<string, any>
  path: string
  references?: Set<string>
  scopedContext: Record<string, any>
}) {
  const resolved = require.resolve(params.path)
  const getModuleCode = `(function(module,exports,require,__dirname,__filename,globalThis,${Object.keys(
    params.scopedContext
  ).join(',')}) {${readFileSync(resolved, 'utf-8')}\n})`
  const module = {
    exports: {},
    loaded: false,
    id: resolved,
  }

  const moduleRequire = (Module.createRequire || Module.createRequireFromPath)(
    resolved
  )

  function throwingRequire(path: string) {
    if (path.startsWith('./')) {
      const moduleName = path.replace(/^\.\//, '')
      if (!params.cache?.has(moduleName)) {
        throw new Error(`Cannot find module '${moduleName}'`)
      }
      return params.cache.get(moduleName).exports
    }
    return moduleRequire(path)
  }

  throwingRequire.resolve = moduleRequire.resolve.bind(moduleRequire)

  eval(getModuleCode)(
    module,
    module.exports,
    throwingRequire,
    dirname(resolved),
    resolved,
    params.context,
    ...Object.values(params.scopedContext)
  )

  return module.exports
}
