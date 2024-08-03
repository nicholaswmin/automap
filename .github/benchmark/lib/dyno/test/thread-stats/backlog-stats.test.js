import test from 'node:test'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

import { Dyno } from '../../index.js'
import { resetDB } from '../utils/sqlite.js'

test('Measures: Thread Backlog', async t => {
  let dyno = null, result = null, randomId = randomUUID()

  t.after(() => resetDB())

  t.before(async () => {
    dyno = new Dyno({
      task: join(import.meta.dirname, 'tasks/task.js'),
      parameters: {
        TASKS_SECOND: 100,
        THREAD_COUNT: 2,
        DURATION_SECONDS: 2,
        RANDOM_ID: randomId
      }
    })

    result = await dyno.start()
  })

  await t.test('each thread has stats recorded on:', async t => {
    const pids = Object.keys(result.threads)
    const pid = pids[0]

    await t.test('its backlog of tasks', async t => {
      await t.test('in a histogram format', async t => {
        const last = result.threads[pid].backlog.at(-1)

        t.assert.ok(Object.hasOwn(last, 'count'))
        t.assert.ok(Object.hasOwn(last, 'min'))
        t.assert.ok(Object.hasOwn(last, 'mean'))
        t.assert.ok(Object.hasOwn(last, 'max'))

        await t.test('with reasonable "max" values', async t => {
          t.assert.ok(last.max > 30, `max is: ${last.max}`)
          t.assert.ok(last.max < 400, `mean is: ${last.max}`)
        })
      })
    })
  })
})
