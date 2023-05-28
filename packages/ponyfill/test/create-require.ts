import { readFileSync } from 'fs'
import { dirname } from 'path'
import { Context, runInContext } from 'vm'

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
