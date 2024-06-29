import assert from 'node:assert'
import { mock, test, before, beforeEach } from 'node:test'

import Task from '../../src/task.js'


test('Task', async t => {
  let task, mockFn

  await t.test ('#run', async t => {
    await t.beforeEach(async t => {
      mockFn = mock.fn()
      task = new Task({ name: 'foo', cycles: 10, fn: mockFn })
    })

    await t.test('runs x amount of times', async t => {
      await task.run()

      assert.strictEqual(mockFn.mock.callCount(), 10)
    })

    await t.test('records the runs in its "task.histogram"', async t => {
      await t.beforeEach(async t => {
        await task.run()
      })

      assert.ok(Object.hasOwn(task, 'histogram'))

      await t.test('of type RecordableHistogram', async t => {
        assert.strictEqual(
          task.histogram.constructor.name,
          'RecordableHistogram'
        )
      })

      await t.test('which was called 10 times', async t => {
        assert.strictEqual(task.histogram.count, 10)
      })
    })

    await t.test('returns its memory usage', async t => {
      const memUsages = await task.run()
      assert.ok(Array.isArray(memUsages))

      await t.test('has a usage item for each run', async t => {
        assert.strictEqual(memUsages.length, task.cycles)
      })

      await t.test('each of type object', async t => {
        memUsages.forEach(usage => assert.strictEqual(typeof usage, 'object'))
      })

      await t.test('each has a "heapUsed" property', async t => {
        memUsages.forEach(usage => assert.ok(Object.hasOwn(usage, 'heapUsed')))
      })

      await t.test('of type number', async t => {
        memUsages.forEach(usage => {
          assert.strictEqual(typeof usage.heapUsed, 'number')
        })
      })

      await t.test('is a big positive number', async t => {
        memUsages.forEach(usage => assert.ok(usage.heapUsed > 1000))
      })
    })

    await t.test('passes an arguments array when calling "fn"', async t => {
      await t.test('has an object as 1st element', async t => {
        mockFn.mock.calls.forEach(call => {
          assert.ok(Array.isArray(call.arguments))
        })

        mockFn.mock.calls.forEach(call => {
          assert.ok(typeof call.arguments[0] === 'object')
        })
      })

      await t.test('has a "cycle" property', async t => {
        mockFn.mock.calls.forEach(call => {
          assert.ok(Object.hasOwn(call.arguments[0], 'cycle'))
        })

        await t.test('of type number', async t => {
          mockFn.mock.calls.forEach(call => {
            assert.ok(typeof call.arguments[0].cycle === 'number')
          })
        })

        await t.test('equals 10', async t => {
          mockFn.mock.calls.forEach(call => {
            assert.ok(call.arguments[0].cycle === 10)
          })
        })
      })

      await t.test('has a "taskname" property', async t => {
        mockFn.mock.calls.forEach(call => {
          assert.ok(Object.hasOwn(call.arguments[0], 'cycle'))
        })

        await t.test('of type string', async t => {
          mockFn.mock.calls.forEach(call => {
            assert.ok(typeof call.arguments[0].cycle === 'string')
          })
        })

        await t.test('equals "foo"', async t => {
          mockFn.mock.calls.forEach(call => {
            assert.ok(call.arguments[0].taskname === 'foo')
          })
        })
      })
    })
  })
})
