import { createFormat } from '../dist'

const format = createFormat()

it('first argument', () => {
  expect(format()).toBe('')
  expect(format('')).toBe('')
  expect(format([])).toBe('[]')
  expect(format({})).toBe('{}')
  expect(format(null)).toBe('null')
  expect(format(true)).toBe('true')
  expect(format(false)).toBe('false')
  expect(format('test')).toBe('test')
  expect(format(() => {})).toBe('[Function]')
  expect(format(function () {})).toBe('[Function]')
  expect(format(Symbol('mysymbol'))).toBe('Symbol(mysymbol)')
  expect(format(BigInt(9007199254740991))).toBe('9007199254740991')
})

it('string (%s)', () => {
  expect(format('%s')).toBe('%s')
  expect(format('foo')).toBe('foo')
  expect(format('%s', 42)).toBe('42')
  expect(format('%s', '42')).toBe('42')
  expect(format('%s', Symbol('mysymbol'))).toBe('Symbol(mysymbol)')
  expect(format('%s', BigInt(9007199254740991))).toBe('9007199254740991')
  expect(format('%s:%s')).toBe('%s:%s')
  expect(format('%s', 'foo')).toBe('foo')
  expect(format('%%%s%%', 'hi')).toBe('%hi%')
  expect(format('%%s', 'foo')).toBe('%s foo')
  expect(format('%%s%s', 'foo')).toBe('%sfoo')
  expect(format('%s:%s', 'foo')).toBe('foo:%s')
  expect(format(new Date(123))).toBe(
    'Thu Jan 01 1970 00:00:00 GMT+0000 (Coordinated Universal Time)'
  )
  expect(format('%%%s%%%%', 'hi')).toBe('%hi%%')
  expect(format('%s', undefined)).toBe('undefined')
  expect(format('%s:%s', 'foo', 'bar')).toBe('foo:bar')
  expect(format('foo', 'bar', 'baz')).toBe('foo bar baz')
  expect(format('%s:%s', undefined)).toBe('undefined:%s')
  expect(format(new Error('oh no'))).toBe('[Error: oh no]')
  expect(format('%s:%s', 'foo', 'bar', 'baz')).toBe('foo:bar baz')
  expect(format(function greetings() {})).toBe('[Function: greetings]')
  ;(() => {
    const greetings = () => {}
    expect(format(greetings)).toBe('[Function: greetings]')
  })()
  ;(() => {
    class CustomError extends Error {
      readonly name = 'CustomError'
    }
    expect(format(new CustomError('bar'))).toBe(
      "{ [CustomError: bar] name: 'CustomError' }"
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
  expect(format('%d', BigInt(9007199254740991))).toBe('9007199254740991')
})

it('object generic (%O)', () => {
  expect(format('%O')).toBe('%O')
  expect(format('%O', BigInt(9007199254740991))).toBe('9007199254740991')
  expect(format('%O', Symbol('mysymbol'))).toBe('Symbol(mysymbol)')
  expect(format('%O', 'foo')).toBe("'foo'")
  expect(format('%O', /foo/g)).toBe('/foo/g')
  expect(format('%O', { foo: 'bar' })).toBe("{ foo: 'bar' }")
  expect(format('%O', [1, 2, 3])).toBe('[ 1, 2, 3 ]')
  expect(format('%O', { error: new Error('oh no') })).toBe(
    '{ error: [Error: oh no] }'
  )
  expect(format('%O', { date: new Date(123) })).toBe(
    '{ date: Thu Jan 01 1970 00:00:00 GMT+0000 (Coordinated Universal Time) }'
  )
})

it('object (%o)', () => {
  expect(format('%o')).toBe('%o')
  expect(format('%o', 'foo')).toBe("'foo'")
  expect(format('%o', [1, 2, 3])).toBe('[ 1, 2, 3, length: 3 ]')
  expect(format('%o', BigInt(9007199254740991))).toBe('9007199254740991')
  expect(format('%o', Symbol('mysymbol'))).toBe('Symbol(mysymbol)')
  expect(format('%o', { foo: 'bar' })).toBe("{ foo: 'bar' }")
  expect(format('%o', { foo: 'bar', fooz: 'barz' })).toBe(
    "{ foo: 'bar', fooz: 'barz' }"
  )
  ;(function () {
    const error = new Error('mock error')
    delete error.stack
    expect(format('%o', error)).toBe(
      "{ [Error: mock error] message: 'mock error' }"
    )
  })()

  expect(format('%O', new Date(123))).toBe(
    'Thu Jan 01 1970 00:00:00 GMT+0000 (Coordinated Universal Time)'
  )
})

it('integer (%i)', () => {
  expect(format('%i')).toBe('%i')
  expect(format('%i', 1000)).toBe('1000')
  expect(format('%i', 10.9)).toBe('10')
  expect(format('%i', BigInt(9007199254740991))).toBe('9007199254740991')
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
})
