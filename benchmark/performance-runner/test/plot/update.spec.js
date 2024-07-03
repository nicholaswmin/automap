import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'
import { setTimeout } from 'timers/promises'

import CyclePlot from '../../src/cycle-plot.js'

test('CyclePlot', async t => {
  let i = 0
  let plot = null
  let entries = []

  await t.test('#update', async t => {
    await beforeEach(async t => {
      entries = [
        {
          name: 'gc',  startTime: 1, duration: 5, entryType: 'gc', detail: []
        },

        {
          name: 'fn',
          startTime: 2, duration: 10, entryType: 'function',
          detail: [{ cycle: 3, taskname: 'foo' }]
        },

        {
          name: 'foo',
          startTime: 5, duration: 5, entryType: 'function', detail: []
        },

        {
          name: 'foo',
          startTime: 5, duration: 5, entryType: 'function', detail: []
        }
      ]

      plot = new CyclePlot({ name: 'Foo', entries: entries })

      await plot.update(i++)
    })

    await t.test('only function entries added as cycles', async t => {
      assert.strictEqual(Object.keys(plot.cycles).length, 1)
    })

    await t.test('"fn" use detail.0.taskname for name', async t => {
      assert.ok(Object.keys(plot.cycles).includes('foo'))
    })

    await t.test("entries are grouped by name", async t => {
      assert.ok(Array.isArray(plot.cycles.foo))
      assert.strictEqual(plot.cycles.foo.length, 4)
    })

    await t.test('adding an entry in another cycle', async t => {
      i = 0

      await beforeEach(async t => {
        plot.entries.push(...[
          {
            name: 'fn',
            startTime: 5, duration: 5, entryType: 'function', detail: [{
              cycle: 0,
              taskname: 'bar'
            }]
          }
        ])

        await plot.update(i++)
      })

      await t.test('all cycles have same number of entries', async t => {
        const allEqual = Object.values(plot.cycles)
          .map(arr => arr.length)
          .every((v, i, arr) => v === arr[0])

        assert.ok(allEqual)
      })
    })
  })
})
