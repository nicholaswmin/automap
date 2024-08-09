import test from 'node:test'

import Plot from '../index.js'

test('#view:Plot', async t => {
  let plot = null,
  histogramSnapshots = {
    foo: [
      { min: 0, mean: 3, max: 4, count: 2 },
      { min: 4, mean: 5, max: 6, count: 4 },
      { min: 6, mean: 7, max: 8, count: 9 },
    ],
    bar: [
      { min: 1, mean: 2, max: 3, count: 1 },
      { min: 3, mean: 4, max: 5, count: 3 },
      { min: 5, mean: 6, max: 7, count: 5 },
      { min: 7, mean: 8, max: 9, count: 7 }
    ],
    baz: [
      { min: 2, mean: 2.5, max: 3, count: 4 },
      { min: 6, mean: 8, max: 10, count: 4  }
    ]
  }

  t.beforeEach(async () => {
    plot = new Plot('Plot', { 
      properties: ['foo', 'bar'],
      subtitle: 'foo subtitle'
    })
  })

  await t.test('instantiates', async t => {
    t.assert.ok(plot)
  })
  
  await t.test('properties does not include a property', async t => {
    await t.test('throws a RangeError', t => {
      t.assert.throws(() => {
         plot = new Plot('Plot', { properties: [] })
      }, {
        name: 'RangeError'
      })
    })
  })
  
  await t.test('properties array includes at least 1 property', async t => {
    await t.test('instantiates', async t => {
      plot = new Plot('Plot', { properties: ['foo'] })
      
      await t.test('sets an ASCII chart', t => {
        t.assert.ok(plot.chart)
      })
    })
  })
  
  await t.test('#plot', async t => {
    t.beforeEach(() => {
      plot.plot(histogramSnapshots)
    })

    await t.test('sets an ASCII chart', async t => {
      t.assert.ok(plot.chart)
    })
    
    await t.test('plots only the specified properties', async t => {
      t.assert.ok(plot.chart.includes('foo'), 'expected "foo" to be plotted')
      t.assert.ok(plot.chart.includes('bar'), 'expected "bar" to be plotted')
      t.assert.ok(!plot.chart.includes('baz'), 'expected to NOT plot "baz"')
    })
    
    await t.test('includes the specified subtitle', async t => {
      t.assert.ok(plot.chart.includes(
        'foo subtitle', 
        'expected to find "foo subtitle"'
      ))
    })
  })
  
  await t.test('#render', async t => {    
    await t.test('returns an ASCII chart', async t => {
      t.assert.strictEqual(typeof plot.render(false), 'string')
      t.assert.strictEqual(plot.render(false), plot.chart)
    })
    
    t.todo('renders an ASCII chart in stdout', async t => {
      // a bit tricky to test stdout output, ignoring for now
    })
  })
})
