import test from 'node:test'
import { randomUUID } from 'node:crypto'

import { Dyno, configure } from '../../index.js'
import { resetDB, insertDBRow, selectDBRows } from '../utils/sqlite.js'

test('Passing hook before/after hooks, on 1 thread', async t => {
  let dyno, randomId = randomUUID()

  t.before(async () => {
    resetDB()

    dyno = new Dyno({
      task: './test/hooks/tasks/task.js',
      parameters: await configure({
        TASKS_SECOND: 10,
        THREAD_COUNT: 1,
        DURATION_SECONDS: 2,
        RANDOM_ID: randomId
      }),
      before: parameters => {
        return insertDBRow(process.pid, parameters.RANDOM_ID, 'runner:before')
      },
      after: parameters => {
        return insertDBRow(process.pid, parameters.RANDOM_ID, 'runner:after')
      }
    })

    await dyno.start()
  })

  await t.test('runs the hooks', async t => {
    let rows

    t.before(() => {
      rows = selectDBRows(randomId)
    })
    
    await t.test('runner:before', async t => {
      const result = rows.filter(row => row.alt === 'runner:before')

      await t.test('runs it', t => {
        t.assert.ok(result.length, 'cannot find a "runner:before" row')
      })

      await t.test('runs it, once', t => {
        t.assert.ok(result.length === 1, `found: ${result.length} rows, is > 1`)
      })
    })
    
    await t.test('runner:after', async t => {
      const result = rows.filter(row => row.alt === 'runner:after')

      await t.test('runs it, once', t => {
        t.assert.ok(result.length === 1, `found: ${result.length} rows, is > 1`)
      })
    })
    
    await t.test('task:before', async t => {
      const result = rows.filter(row => row.alt === 'task:before')

      await t.test('runs it, once', t => {
        t.assert.ok(result.length === 1, `found: ${result.length} rows, is > 1`)
      })
    })
    
    await t.test('task:after', async t => {
      const result = rows.filter(row => row.alt === 'task:after')

      await t.test('runs it, once', t => {
        t.assert.ok(result.length === 1, `found: ${result.length} rows, is > 1`)
      })
    })
    
    await t.test('runs the hooks in the correct order', async t => {
      await t.test('runs runner:before hook first', async t => {
        t.assert.strictEqual(rows[0].alt, 'runner:before')
      })
      
      await t.test('runs task:before hook second', async t => {
        t.assert.strictEqual(rows[1].alt, 'task:before')
      })
      
      await t.test('runs the task', async t => {
        t.assert.strictEqual(rows[3].alt, 'task')
      })
      
      await t.test('runs the task:after second from last', async t => {
        t.assert.strictEqual(rows.at(-2).alt, 'task:after')
      })
      
      await t.test('runs runner:after, last', async t => {
        t.assert.strictEqual(rows.at(-1).alt, 'runner:after')
      })
    })
  })
})
