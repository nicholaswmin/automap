import test from 'node:test'
import { randomUUID } from 'node:crypto'

import { Dyno, configure } from '../../index.js'
import { resetDB, selectDBRows } from '../utils/sqlite.js'

test('start(): runs to completion', async t => {
  let dyno, randomId = randomUUID()

  t.beforeEach(async () => {
    resetDB()

    dyno = new Dyno({
      task: './test/run/task.js',
      parameters: await configure({
        TASKS_SECOND: 50,
        THREAD_COUNT: 5,
        DURATION_SECONDS: 5,
        RANDOM_ID: randomId
      })
    })
  })

  await t.test('instantiates', t => {
    t.assert.ok(dyno)
  })

  await t.test('runs for specified amount of time', {
    timeout: 8000
  }, async t => {
    const start = performance.now()
    const result = await dyno.start()
    const duration = performance.now() - start

    t.assert.ok(duration > 4500, `duration: ${duration} is not > 4500`)
    t.assert.ok(duration < 6500, `duration: ${duration} is not < 6500`)
  })

  await t.test('task saves rows into an SQLite DB', {
    timeout: 8000
  }, async t => {
    let rows

    await t.before(async () => {
      await dyno.start()

      rows = await selectDBRows(randomId)
    })

    await t.test('the rows exist', async t => {
      t.assert.ok(rows)
    })

    await t.test('count of rows is proportional to parameters', async t => {
      t.assert.ok(rows.length > 150, `line count: ${rows.length}, not > 150`)
      t.assert.ok(rows.length < 500, `line count: ${rows.length}, not < 500`)
    })

    await t.test('rows are written by 5 separate threads', async t => {
      const pids = Object.groupBy(rows, ({ pid }) => pid)

      t.assert.strictEqual(Object.keys(pids).length, 5)
    })
  })
})
