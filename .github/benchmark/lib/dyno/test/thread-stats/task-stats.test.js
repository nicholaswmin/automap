import test from 'node:test'
import { randomUUID } from 'node:crypto'

import { Dyno, configure } from '../../index.js'
import { resetDB } from '../utils/sqlite.js'

test('thread-task timings', async t => {
  let dyno = null, result = null, randomId = randomUUID()

  t.after(() => resetDB())

  t.before(async () => {
    dyno = new Dyno({
      task: './test/thread-stats/task.js',
      parameters: await configure({
        TASKS_SECOND: 100,
        THREAD_COUNT: 5,
        DURATION_SECONDS: 5,
        RANDOM_ID: randomId
      })
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
                t.assert.ok(last.count > 70, `count is: ${last.count}`)
                t.assert.ok(last.count < 500, `count is: ${last.count}`)
              })

              await t.test('with reasonable "min" values', async t => {
                t.assert.ok(last.min > 0, `min is: ${last.min}`)
                t.assert.ok(last.min < 10, `min is: ${last.min}`)
              })

              await t.test('with reasonable "mean" values', async t => {
                t.assert.ok(last.mean > 40, `mean is: ${last.mean}`)
                t.assert.ok(last.mean < 65, `mean is: ${last.mean}`)
              })

              await t.test('with reasonable "max" values', async t => {
                t.assert.ok(last.max > 80, `max is: ${last.max}`)
                t.assert.ok(last.max < 150, `max is: ${last.max}`)
              })
            })
          })
        })
      })
    })
  })
})
