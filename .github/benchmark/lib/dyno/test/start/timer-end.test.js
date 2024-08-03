import test from 'node:test'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

import { Dyno } from '../../index.js'
import { resetDB, selectDBRows } from '../utils/sqlite.js'

test('#Dyno.start()', async t => {
  let dyno, RANDOM_ID = randomUUID()

  t.beforeEach(async () => {
    resetDB()

    dyno = new Dyno({
      task: join(import.meta.dirname, 'tasks/add-db-rows.js'),
      parameters: {
        TASKS_SECOND: 50,
        THREAD_COUNT: 5,
        TEST_SECONDS: 2,
        RANDOM_ID
      }
    })
  })

  await t.test('instantiates', t => {
    t.assert.ok(dyno)
  })

  await t.test('runs for the specified duration', {
    timeout: 5000
  }, async t => {
    const start = performance.now()
    await dyno.start()
    const duration = performance.now() - start

    t.assert.ok(duration > 1500, `duration: ${duration} is not > 1500`)
    t.assert.ok(duration < 4000, `duration: ${duration} is not < 4000`)
  })

  await t.test('task/thread output', {
    timeout: 5000
  }, async t => {
    let rows

    t.before(async () => {
      await dyno.start()

      rows = await selectDBRows(RANDOM_ID)
    })

    await t.test('each thread creates some output', async t => {
      t.assert.ok(rows)
    })

    await t.test('proportional to specified parameters', async t => {
      t.assert.ok(rows.length > 60, `line count: ${rows.length}, not > 60`)
      t.assert.ok(rows.length < 500, `line count: ${rows.length}, not < 500`)
    })

    await t.test('created by separate thread', async t => {
      const pids = Object.groupBy(rows, ({ pid }) => pid)

      t.assert.strictEqual(Object.keys(pids).length, 5)
    })
  })
})
