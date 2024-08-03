import test from 'node:test'
import { randomUUID } from 'node:crypto'

import { Dyno } from '../../index.js'
import { resetDB, selectDBRows } from '../utils/sqlite.js'

test('#Dyno.start()', async t => {
  let dyno, randomId = randomUUID()

  t.beforeEach(async () => {
    resetDB()

    dyno = new Dyno({
      task: './test/run/tasks/task.js',
      parameters: {
        TASKS_SECOND: 50,
        THREAD_COUNT: 5,
        DURATION_SECONDS: 2,
        RANDOM_ID: randomId
      }
    })
  })

  await t.test('instantiates', t => {
    t.assert.ok(dyno)
  })

  await t.test('runs for specified amount of time', {
    timeout: 5000
  }, async t => {
    const start = performance.now()
    await dyno.start()
    const duration = performance.now() - start

    t.assert.ok(duration > 1500, `duration: ${duration} is not > 1500`)
    t.assert.ok(duration < 4000, `duration: ${duration} is not < 4000`)
  })

  await t.test('task saves rows into an SQLite DB', {
    timeout: 5000
  }, async t => {
    let rows

    await t.before(async () => {
      await dyno.start()

      rows = await selectDBRows(randomId)
    })

    await t.test('DB rows are inserted', async t => {
      t.assert.ok(rows)
    })

    await t.test('row count is proportional to parameters', async t => {
      t.assert.ok(rows.length > 60, `line count: ${rows.length}, not > 60`)
      t.assert.ok(rows.length < 500, `line count: ${rows.length}, not < 500`)
    })

    await t.test('are written by X number of separate threads', async t => {
      const pids = Object.groupBy(rows, ({ pid }) => pid)

      t.assert.strictEqual(Object.keys(pids).length, 5)
    })
  })
})
