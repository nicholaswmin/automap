import test from 'node:test'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createHistogram } from 'node:perf_hooks'

import { Dyno } from '../../index.js'
import { resetDB, selectDBRows } from '../utils/sqlite.js'

test('#Dyno.start()', async t => {
  let dyno, histogram = createHistogram(), rows = null 

  t.before(async () => {
    resetDB()

    dyno = new Dyno({
      task: join(import.meta.dirname, 'tasks/add-db-rows.js'),
      parameters: {
        TASKS_SECOND: 50,
        THREAD_COUNT: 5,
        TEST_SECONDS: 2,
        RANDOM_ID: randomUUID()
      }
    })

    await performance.timerify(dyno.start.bind(dyno), { histogram })()

    rows = selectDBRows(dyno.parameters.RANDOM_ID)
  })
  
  await t.test('runs once', t => {
    t.assert.strictEqual(histogram.count, 1)
  })

  await t.test('for the specified duration', async t => {
    const durationMS = Math.round(histogram.mean / 1000000)

    t.assert.ok(durationMS > 1500, `duration: ${durationMS} is not > 1500`)
    t.assert.ok(durationMS < 4000, `duration: ${durationMS} is not < 4000`)
  })

  await t.test('task/thread output', async t => {
    await t.test('each thread creates some output', async t => {
      t.assert.ok(rows)
    })

    await t.test('proportional to specified parameters', async t => {
      t.assert.ok(rows.length > 60, `line count: ${rows.length}, not > 60`)
      t.assert.ok(rows.length < 500, `line count: ${rows.length}, not < 500`)
    })

    await t.test('created by a number of threads', async t => {
      const pids = Object.groupBy(rows, ({ pid }) => pid)
      const threadCount = Object.keys(pids).length

      t.assert.ok(threadCount > 1, 'thread count is not > 1')

      await t.test('equal to the specified thread count', async t => {
        t.assert.strictEqual(threadCount, dyno.parameters.THREAD_COUNT)
      })
    })
  })
})
