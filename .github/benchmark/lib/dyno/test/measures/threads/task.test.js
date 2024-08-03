import test from 'node:test'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

import { Dyno } from '../../../index.js'
import { resetDB } from '../../utils/sqlite.js'

test('Measures thread:task', async t => {
  let dyno, result = null

  t.after(() => resetDB())

  t.before(async () => {
    dyno = new Dyno({
      task: join(import.meta.dirname, 'tasks/sleep-random.js'),
      parameters: {
        TASKS_SECOND: 100,
        THREAD_COUNT: 5,
        TEST_SECONDS: 1,
        RANDOM_ID: randomUUID()
      }
    })

    result = await dyno.start()
  })

  await t.test('collects task timing statistics', async t => {
    await t.test('produces a result', async t => {
      t.assert.ok(result)
    })

    await t.test('result has stats on:', async t => {
      t.assert.ok(Object.hasOwn(result, 'threads'))

      await t.test('each of the threads', async t => {
        t.assert.strictEqual(Object.keys(result.threads).length, 5)

        await t.test('each thread has stats recorded on:', async t => {
          const pids = Object.keys(result.threads)
          const pid = pids[0]

          await t.test('its task timings', async t => {
            const rows = result.threads[pid].task
            const last = result.threads[pid].task.at(-1)

            t.assert.ok(rows.length > 5)

            await t.test('in a histogram format', async t => {
              t.assert.ok(Object.hasOwn(last, 'count'))
              t.assert.ok(Object.hasOwn(last, 'min'))
              t.assert.ok(Object.hasOwn(last, 'mean'))
              t.assert.ok(Object.hasOwn(last, 'max'))

              await t.test('with reasonable "count" values', async t => {
                t.assert.ok(last.count > 5, `count: ${last.count}`)
                t.assert.ok(last.count < 500, `count: ${last.count}`)
              })

              await t.test('with reasonable "min" values', async t => {
                t.assert.ok(last.min > 0, `min is: ${last.min}, not > 0`)
                t.assert.ok(last.min < 35, `min is: ${last.min}, not < 30`)
              })

              await t.test('with reasonable "mean" values', async t => {
                t.assert.ok(last.mean > 35, `mean is: ${last.mean}`)
                t.assert.ok(last.mean < 60, `mean is: ${last.mean}`)
              })

              await t.test('with reasonable "max" values', async t => {
                t.assert.ok(last.max > 60, `max is: ${last.max}`)
                t.assert.ok(last.max < 300, `max is: ${last.max}`)
              })
            })
          })
        })
      })
    })
  })
})
