import { createFormat } from '../dist'

const format = createFormat()

it('first argument', () => {
  expect(format()).toBe('')
  expect(format('')).toBe('')
  expect(format([])).toBe('[]')
  expect(format({})).toBe('{}')
  expect(format(Object.create(null))).toBe('[Object: null prototype] {}')
  expect(
    format(
      (() => {
        const o = Object.create(null)
        o.name = 'name'
        return o
      })()
    )
  ).toBe(`{ name: 'name' }`)
  expect(format(null)).toBe('null')
  expect(format(true)).toBe('true')
  expect(format(false)).toBe('false')
  expect(format('test')).toBe('test')
  expect(format(() => {})).toBe('[Function]')
  expect(format(function () {})).toBe('[Function]')
  expect(format(function greetings() {})).toBe('[Function: greetings]')
  expect(format(Symbol('mysymbol'))).toBe('Symbol(mysymbol)')
  expect(format(BigInt(9007199254740991))).toBe('9007199254740991n')
  expect(format({ [Symbol('a')]: 1 })).toBe('{ [Symbol(a)]: 1 }')
  expect(format(new Date(123))).toBe('1970-01-01T00:00:00.123Z')
  expect(format(new Date('asdf'))).toBe('Invalid Date')
  expect(format(new Error('oh no'))).toBe('[Error: oh no]')
  expect(
    format(
      (() => {
        const fn = function () {}
        fn[Symbol.for('a')] = 'foo'
        return fn
      })()
    )
  ).toBe("[Function: fn] { [Symbol(a)]: 'foo' }")

  expect(
    format(
      (() => {
        const fn = function () {}
        fn[Symbol.for('a')] = 'foo'
        fn[Symbol.for('b')] = 'bar'
        return fn
      })()
    )
  ).toBe("[Function: fn] { [Symbol(a)]: 'foo', [Symbol(b)]: 'bar' }")

  expect(
    format(
      (() => {
        const fn = function () {}
        fn[Symbol.for('aaaaaaaaaaaa')] = 'foo'
        fn[Symbol.for('bbbbbbbbbbbbbbb')] = 'bar'
        return fn
      })()
    )
  ).toBe(`[Function: fn] {
  [Symbol(aaaaaaaaaaaa)]: 'foo',
  [Symbol(bbbbbbbbbbbbbbb)]: 'bar'
}`)

  expect(format(new Map([['foo', 'bar']]))).toBe("Map(1) { 'foo' => 'bar' }")
  expect(format(new Set([['foo', 'bar']]))).toBe("Set(1) { [ 'foo', 'bar' ] }")
  expect(format(new Uint8Array([1, 2, 3]))).toBe('Uint8Array(3) [ 1, 2, 3 ]')
  expect(format(new Uint8Array(0))).toBe('Uint8Array(0) []')
  expect(format(new BigInt64Array([0n]))).toBe('BigInt64Array(1) [ 0n ]')
  expect(format(new BigUint64Array([0n]))).toBe('BigUint64Array(1) [ 0n ]')
  ;[
    Float32Array,
    Float64Array,
    Int16Array,
    Int32Array,
    Int8Array,
    Uint16Array,
    Uint32Array,
    Uint8Array,
    Uint8ClampedArray,
  ].forEach((constructor) => {
    const length = 2
    const byteLength = length * constructor.BYTES_PER_ELEMENT
    const array = new constructor(new ArrayBuffer(byteLength), 0, length)
    array[0] = 65
    array[1] = 97
    expect(format('%o', array)).toBe(
      `${constructor.name}(${length}) [\n` +
        '  65,\n' +
        '  97,\n' +
        `  [BYTES_PER_ELEMENT]: ${constructor.BYTES_PER_ELEMENT},\n` +
        `  [length]: ${length},\n` +
        `  [byteLength]: ${byteLength},\n` +
        '  [byteOffset]: 0,\n' +
        `  [buffer]: ArrayBuffer {  }\n]`
    )
    expect(format(array)).toBe(`${constructor.name}(${length}) [ 65, 97 ]`)
  })

  // Dynamic properties.
  {
    expect(
      format({
        get readonly() {
          return 1
        },
      })
    ).toBe('{ readonly: [Getter] }')
    expect(
      format({
        get readwrite() {
          return 1
        },
        set readwrite(val) {},
      })
    ).toBe('{ readwrite: [Getter/Setter] }')
    expect(format({ set writeonly(val) {} })).toBe('{ writeonly: [Setter] }')

    const value = {}
    value.a = value
    expect(format(value)).toBe('<ref *1> { a: [Circular *1] }')
  }

  // Test Set.
  {
    expect(format(new Set())).toBe('Set(0) {}')
    expect(format(new Set([1, 2, 3]))).toBe('Set(3) { 1, 2, 3 }')
  }

  // Test circular Set.
  {
    const set = new Set()
    set.add(set)
    expect(format(set)).toBe('<ref *1> Set(1) { [Circular *1] }')
  }

  // Test Map.
  {
    expect(format(new Map())).toBe('Map(0) {}')
    expect(
      format(
        new Map([
          [1, 'a'],
          [2, 'b'],
          [3, 'c'],
        ])
      )
    ).toBe("Map(3) { 1 => 'a', 2 => 'b', 3 => 'c' }")
  }

  // Test circular Map.
  {
    const map = new Map()
    map.set(map, 'map')
    expect(format(map)).toBe("<ref *1> Map(1) { [Circular *1] => 'map' }")
    map.set(map, map)
    expect(format(map)).toBe(
      '<ref *1> Map(1) { [Circular *1] => [Circular *1] }'
    )
    map.delete(map)
    map.set('map', map)
    expect(format(map)).toBe("<ref *1> Map(1) { 'map' => [Circular *1] }")
  }

  // Test multiple circular references.
  {
    const obj = {}
    obj.a = [obj]
    obj.b = {}
    obj.b.inner = obj.b
    obj.b.obj = obj

    expect(format(obj)).toBe(
      '<ref *1> {\n' +
        '  a: [ [Circular *1] ],\n' +
        '  b: <ref *2> { inner: [Circular *2], obj: [Circular *1] }\n' +
        '}'
    )
  }
})

it('string (%s)', () => {
  expect(format('%s')).toBe('%s')
  expect(format('foo')).toBe('foo')
  expect(format('%s', 42)).toBe('42')
  expect(format('%s', '42')).toBe('42')
  expect(format('%s', Symbol('mysymbol'))).toBe('Symbol(mysymbol)')
  expect(format('%s', BigInt(9007199254740991))).toBe('9007199254740991n')
  expect(format('%s:%s')).toBe('%s:%s')
  expect(format('%s', 'foo')).toBe('foo')
  expect(format('%%%s%%', 'hi')).toBe('%hi%')
  expect(format('%%s', 'foo')).toBe('%s foo')
  expect(format('%%s%s', 'foo')).toBe('%sfoo')
  expect(format('%s:%s', 'foo')).toBe('foo:%s')
  expect(format('%s', new Date(123))).toBe('1970-01-01T00:00:00.123Z')
  expect(format('%s', new Date('invalid'))).toBe('Invalid Date')
  expect(format('%%%s%%%%', 'hi')).toBe('%hi%%')
  expect(format('%s', undefined)).toBe('undefined')
  expect(format('%s:%s', 'foo', 'bar')).toBe('foo:bar')
  expect(format('foo', 'bar', 'baz')).toBe('foo bar baz')
  expect(format('%s:%s', undefined)).toBe('undefined:%s')
  expect(format('%s', new Error('oh no'))).toBe('[Error: oh no]')
  expect(format('%s:%s', 'foo', 'bar', 'baz')).toBe('foo:bar baz')
  expect(format('%s', function greetings() {})).toBe('function greetings() { }')
  ;(() => {
    const greetings = () => {}
    expect(format(greetings)).toBe('[Function: greetings]')
  })()
  ;(() => {
    class CustomError extends Error {
      readonly name = 'CustomError'
    }
    expect(format(new CustomError('bar'))).toBe(
      "[CustomError: bar] { name: 'CustomError' }"
    )
  })()
  ;(() => {
    class CustomObject {
      readonly name = 'CustomObject'
    }
    expect(format(new CustomObject())).toBe(
      "CustomObject { name: 'CustomObject' }"
    )
  })()
})

it('json (%j)', () => {
  expect(format('%j')).toBe('%j')
  expect(format('%j', 42)).toBe('42')
  expect(format('%j', '42')).toBe('"42"')
  expect(format('%j', 'foo')).toBe('"foo"')
  expect(format('%j', [1, 2, 3])).toBe('[1,2,3]')
  ;(function () {
    const o = {}
    // @ts-expect-error
    o.o = o
    expect(format('%j', o)).toBe('{"o":"[Circular]"}')
  })()
})

it('digit (%d)', () => {
  expect(format('%d')).toBe('%d')
  expect(format('%d', 'foo')).toBe('NaN')
  expect(format('%d', '16')).toBe('16')
  expect(format('%d', '42.0')).toBe('42')
  expect(format('%d', 42.0)).toBe('42')
  expect(format('%d', 42)).toBe('42')
  expect(format('%d', BigInt(9007199254740991))).toBe('9007199254740991n')
})

it('object generic (%O)', () => {
  expect(format('%O')).toBe('%O')
  expect(format('%O', BigInt(9007199254740991))).toBe('9007199254740991n')
  expect(format('%O', Symbol('mysymbol'))).toBe('Symbol(mysymbol)')
  expect(format('%O', 'foo')).toBe("'foo'")
  expect(format('%O', /foo/g)).toBe('/foo/g')
  expect(format('%O', { foo: 'bar' })).toBe("{ foo: 'bar' }")
  expect(format('%O', [1, 2, 3])).toBe('[ 1, 2, 3 ]')
  expect(format('%O', { error: new Error('oh no') })).toBe(
    '{ error: [Error: oh no] }'
  )
  expect(format('%O', { date: new Date(123) })).toBe(
    '{ date: 1970-01-01T00:00:00.123Z }'
  )
})

it('object (%o)', () => {
  expect(format('%o')).toBe('%o')
  expect(format('%o', 'foo')).toBe("'foo'")
  expect(format('%o', [1, 2, 3])).toBe('[ 1, 2, 3, length: 3 ]')
  expect(format('%o', BigInt(9007199254740991))).toBe('9007199254740991n')
  expect(format('%o', Symbol('mysymbol'))).toBe('Symbol(mysymbol)')
  expect(format('%o', { foo: 'bar' })).toBe("{ foo: 'bar' }")
  expect(format('%o', { foo: 'bar', fooz: 'barz' })).toBe(
    "{ foo: 'bar', fooz: 'barz' }"
  )
  ;(function () {
    const error = new Error('mock error')
    delete error.stack
    expect(format('%o', error)).toBe(
      "[Error: mock error] { message: 'mock error' }"
    )
  })()

  expect(format('%O', new Date(123))).toBe('1970-01-01T00:00:00.123Z')
})

it('integer (%i)', () => {
  expect(format('%i')).toBe('%i')
  expect(format('%i', 1000)).toBe('1000')
  expect(format('%i', 10.9)).toBe('10')
  expect(format('%i', BigInt(9007199254740991))).toBe('9007199254740991n')
  expect(format('%i', '1,000.9')).toBe('1')
  expect(format('%i', '011')).toBe('11')
  expect(format('%i', '10c')).toBe('10')
  expect(format('%i', '$10')).toBe('NaN')
})

it('float (%f)', () => {
  expect(format('%f')).toBe('%f')
  expect(format('%f', 1000)).toBe('1000')
  expect(format('%f', 10.9)).toBe('10.9')
  expect(format('%f', BigInt(9007199254740991))).toBe('9007199254740991')
  expect(format('%f', '1,000.9')).toBe('1')
  expect(format('%f', '011')).toBe('11')
  expect(format('%f', '10c')).toBe('10')
  expect(format('%f', '$10')).toBe('NaN')
})

it('custom inspect symbol', () => {
  ;(() => {
    const customInspectSymbol = Symbol.for('edge-runtime.inspect.custom')

    const myObject = {
      [customInspectSymbol]() {
        return 'Hello from inspector'
      },
    }

    expect(format(myObject)).toBe('Hello from inspector')
  })()
  ;(() => {
    const customInspectSymbol = Symbol.for('edge-runtime.inspect.custom')

    const myObject = {
      foo: 'bar',
      [customInspectSymbol]() {
        return 'Hello from inspector'
      },
    }

    expect(format('%j', myObject)).toBe('{"foo":"bar"}')
    expect(format(myObject)).toBe('Hello from inspector')
    expect(format('%s', myObject)).toBe('Hello from inspector')
    expect(format('%i', myObject)).toBe('NaN')
    expect(format('%d', myObject)).toBe('NaN')
    expect(format('%f', myObject)).toBe('NaN')
    expect(format('%o', myObject)).toBe('Hello from inspector')
    expect(format('%O', myObject)).toBe('Hello from inspector')
  })()
  ;(() => {
    const customInspectSymbol = Symbol.for('edge-runtime.inspect.custom')

    class Password {
      constructor(value) {
        Object.defineProperty(this, 'password', {
          value,
          enumerable: false,
        })
      }

      toString() {
        return 'xxx'
      }

      [customInspectSymbol]() {
        return `<${this.toString()}>`
      }
    }

    expect(format(new Password('r0sebud'))).toBe('<xxx>')
    expect(format('%s', new Password('r0sebud'))).toBe('<xxx>')
    expect(format('%o', new Password('r0sebud'))).toBe('<xxx>')
    expect(format('%O', new Password('r0sebud'))).toBe('<xxx>')
    expect(format('%j', new Password('r0sebud'))).toBe('{}')
  })()
  ;(() => {
    const customInspectSymbol = Symbol.for('edge-runtime.inspect.custom')

    class Password {
      constructor(value) {
        Object.defineProperty(this, 'password', {
          value,
          enumerable: false,
        })
      }

      toString() {
        return 'xxx'
      }

      [customInspectSymbol]() {
        return {
          password: `<${this.toString()}>`,
        }
      }
    }

    expect(format(new Password('r0sebud'))).toBe("{ password: '<xxx>' }")
    expect(format('%s', new Password('r0sebud'))).toBe("{ password: '<xxx>' }")
    expect(format('%o', new Password('r0sebud'))).toBe("{ password: '<xxx>' }")
    expect(format('%O', new Password('r0sebud'))).toBe("{ password: '<xxx>' }")
    expect(format('%j', new Password('r0sebud'))).toBe('{}')
  })()
  ;(() => {
    const customInspectSymbol = Symbol.for('edge-runtime.inspect.custom')

    class Password {
      constructor(value) {
        Object.defineProperty(this, 'password', {
          value,
          enumerable: false,
        })
      }

      toString() {
        return 'xxx'
      }

      [customInspectSymbol]() {
        return {
          password: `<${this.toString()}>`,
          [customInspectSymbol]: () => `{${this.toString()}}`,
        }
      }
    }

    expect(format(new Password('r0sebud'))).toBe('{xxx}')
    expect(format('%s', new Password('r0sebud'))).toBe('{xxx}')
    expect(format('%o', new Password('r0sebud'))).toBe('{xxx}')
    expect(format('%O', new Password('r0sebud'))).toBe('{xxx}')
    expect(format('%j', new Password('r0sebud'))).toBe('{}')
  })()
  ;(() => {
    const customInspectSymbol = Symbol.for('edge-runtime.inspect.custom')

    class Password {
      private deepObject: Record<string, any>
      constructor(value) {
        Object.defineProperty(this, 'password', {
          value,
          enumerable: false,
        })
        const o = Object.create(null)
        o.name = 'name'
        o.a = { o }
        o.b = { a: o.a }
        this.deepObject = o
        this.deepObject.c = this.deepObject
      }

      [customInspectSymbol]({
        format,
      }: {
        format: (...args: unknown[]) => string
      }) {
        return format(this.deepObject)
      }
    }

    expect(format(new Password('r0sebud'))).toBe(
      `<ref *1> {\n  name: 'name',\n  a: { o: [Circular *1] },\n  b: { a: { o: [Circular *1] } },\n  c: [Circular *1]\n}`
    )
    expect(format('%s', new Password('r0sebud'))).toBe(
      `<ref *1> {\n  name: 'name',\n  a: { o: [Circular *1] },\n  b: { a: { o: [Circular *1] } },\n  c: [Circular *1]\n}`
    )
    expect(format('%o', new Password('r0sebud'))).toBe(
      `<ref *1> {\n  name: 'name',\n  a: { o: [Circular *1] },\n  b: { a: { o: [Circular *1] } },\n  c: [Circular *1]\n}`
    )
    expect(format('%O', new Password('r0sebud'))).toBe(
      `<ref *1> {\n  name: 'name',\n  a: { o: [Circular *1] },\n  b: { a: { o: [Circular *1] } },\n  c: [Circular *1]\n}`
    )
    expect(format('%j', new Password('r0sebud'))).toBe(
      `{"deepObject":{"name":"name","a":{"o":"[Circular]"},"b":{"a":"[Circular]"},"c":"[Circular]"}}`
    )
  })()
})
