import type { Context } from 'vm'
import { readFileSync } from 'fs'
import { runInContext } from 'vm'
import { dirname } from 'path'

export function createRequire(
  context: Context,
  cache: Map<string, any>,
  references?: Set<string>,
  scopedContext: Record<any, any> = {}
) {
  const requireResolve = eval('require.resolve') as (typeof require)['resolve']

  return function requireFn(referrer: string, specifier: string) {
    const resolved = requireResolve(specifier, {
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
