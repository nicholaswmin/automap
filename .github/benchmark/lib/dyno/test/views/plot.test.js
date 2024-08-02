import test from 'node:test'

import { Plot } from '../../index.js'

test('Views: Plot', async t => {
  const obj = {
    foo: [
      { count: 4, min: 1, mean: 4, max: 10, stddev: 1 },
      { count: 5, min: 2, mean: 5, max: 11, stddev: 2 }
    ],
    bar: [
      { count: 6, min: 3, mean: 6, max: 12, stddev: 3 },
      { count: 7, min: 4, mean: 7, max: 13, stddev: 4 }
    ],
    baz: [
      { count: 8, min: 5, mean: 8, max: 14, stddev: 5 },
      { count: 9, min: 6, mean: 9, max: 15, stddev: 6 }
    ],
    bax: []
  }

  let plot

  t.beforeEach(async () => {
    plot = new Plot('Foo', {
      // intentionally skip 'baz'
      properties: ['foo', 'bar', 'bax'],
      subtitle: 'hello world'
    })
  })

  await t.test('not passing object properties', async t => {
    await t.test('throws a RangeError', t => {
      t.assert.throws(() => {
        new Plot('Foo Plot')
      }, { name: 'RangeError' })
    })
  })
  
  await t.test('passing object properties', async t => {
    await t.test('instantiates', t => {
      t.assert.ok(plot)
    })
  })
  
  await t.test('#plot()', async t => {
    t.beforeEach(() => {
      plot.plot(obj)
    })

    await t.test('sets an ASCII chart', t => {
      t.assert.ok(Object.hasOwn(plot, 'chart'), '"plot.chart" prop. not found')
      t.assert.ok(typeof plot.chart === 'string', `exp: string, got: ${t}`)
      // "┤" is an ASCII character on the y-axis of an ASCII chart
      t.assert.ok(plot.chart.includes('┤'), `no chart found on "plot.chart"`)
    })
  })
  
  await t.test('#toString()', async t => {
    let result

    t.beforeEach(() => {
      plot.plot(obj)

      result = plot.toString()
    })
    
    await t.test('returns the ASCII chart', async t => {
      t.assert.ok(result)
      
      await t.test('is a string', t => {
        const type = typeof result 
  
        t.assert.ok(typeof result === 'string', `exp: string, got: ${type}`)
      })
  
      await t.test('contains the passed title', t => {
        t.assert.ok(result.includes('Foo'), 'cannot find "Foo Plot"')
      })

      await t.test('contains the passed subtitle', t => {
        t.assert.ok(result.includes('hello world'), 'cannot find "hello world"')
      })
      
      await t.test('contains the properties as plot labels', t => {
        t.assert.ok(result.includes('-- foo'), 'cannot find "foo" label')
        t.assert.ok(result.includes('-- bar'), 'cannot find "bar" label')
        t.assert.ok(result.includes('-- bax'), 'cannot find "bax" label')
      })
      
      await t.test('does not plot unspecified properties', t => {
        t.assert.ok(!result.includes('-- baz'), '"baz" prop wrongly plotted')
      })
      
      await t.test('plots specified properties', t => {
        // '┼' is always the first ASCII character at start of each plot line
        t.assert.strictEqual(result.split('┼').length - 1, 2)
      })
  
      await t.test('plots the "mean" of each specified property', t => {
        t.assert.ok(result.includes('7.00'), 'cant find "7.00" in chart y-axis')
      })
      
      await t.test('has height of at least 10 rows', t => {
        const rows = plot.chart.trim().split('\n').filter(row => row.length)
  
        t.assert.ok(rows.length >= 10, 'rows is < 10')

        // avoid testing for specific height but "100" is certainly too high
        t.assert.ok(rows.length <= 100, 'chart is > 100 rows')
      })
    })
  })
})
