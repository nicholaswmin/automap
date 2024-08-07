import test from 'node:test'
import { randomUUID } from 'node:crypto'

import { Dyno, prompt } from '../../index.js'
import { resetDB } from '../utils/sqlite.js'

test('Measures: performance.timerify', async t => {
  let dyno = null, result = null, randomId = randomUUID()

  t.after(() => resetDB())

  t.before(async () => {
    dyno = new Dyno({
      task: './test/thread-stats/tasks/task-timerify.js',
      parameters: await prompt({
        TASKS_SECOND: 50,
        THREAD_COUNT: 2,
        DURATION_SECONDS: 2,
        RANDOM_ID: randomId
      })
    })

    result = await dyno.start()
  })

  await t.test('its timings are logged for each thread', async t => {
    const pid = Object.keys(result.threads).pop()
    const rows = result.threads[pid].foo
    const last = result.threads[pid].foo.at(-1)

    t.assert.ok(rows.length > 5)
    await t.test('in a histogram format', async t => {
      t.assert.ok(Object.hasOwn(last, 'count'))
      t.assert.ok(Object.hasOwn(last, 'min'))
      t.assert.ok(Object.hasOwn(last, 'mean'))
      t.assert.ok(Object.hasOwn(last, 'max'))

      await t.test('with reasonable "count" values', async t => {
        t.assert.ok(last.count > 50, `min is: ${last.count}`)
        t.assert.ok(last.count < 40000, `min is: ${last.count}`)
      })

      await t.test('with reasonable "min" values', async t => {
        t.assert.ok(last.min > 0.5, `min is: ${last.min}`)
        t.assert.ok(last.min < 4, `min is: ${last.min}`)
      })

      await t.test('with reasonable "mean" values', async t => {
        t.assert.ok(last.mean > 4, `mean is: ${last.mean}`)
        t.assert.ok(last.mean < 9, `mean is: ${last.mean}`)
      })

      await t.test('with reasonable "max" values', async t => {
        t.assert.ok(last.max > 9, `max is: ${last.max}`)
        t.assert.ok(last.max < 50, `max is: ${last.max}`)
      })
    })
  })
})
