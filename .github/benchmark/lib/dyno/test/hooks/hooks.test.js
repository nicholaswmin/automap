import test from 'node:test'
import { randomUUID } from 'node:crypto'

import { Dyno, prompt } from '../../index.js'
import { resetDB, insertDBRow, selectDBRows } from '../utils/sqlite.js'

test('Dyno/Task: before/after/render hooks', async t => {
  let dyno, randomId = randomUUID()

  t.before(async () => {
    resetDB()
    
    dyno = new Dyno({
      task: './test/hooks/tasks/task.js',
      parameters: await prompt({
        TASKS_SECOND: 1,
        THREAD_COUNT: 1,
        DURATION_SECONDS: 3,
        RANDOM_ID: randomId
      }),

      before: () => {
        return insertDBRow(process.pid, randomId, 'runner:before')
      },

      after: () => {
        return insertDBRow(process.pid, randomId, 'runner:after')
      },

      render: () => {
        return insertDBRow(process.pid, randomId, 'runner:render')
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
    
    await t.test('runner:render', async t => {
      const result = rows.filter(row => row.alt === 'runner:render')

      await t.test('runs it more than once', t => {
        t.assert.ok(result.length > 1, `found: ${result.length} rows, not > 1`)
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
      await t.test('runs "runner:before"', async t => {
        t.assert.strictEqual(rows[0].alt, 'runner:before')
      })
      
      await t.test('then runs "task:before"', async t => {
        t.assert.strictEqual(rows[1].alt, 'task:before')
      })
      
      await t.test('then runs "runner:render"', async t => {
        await t.test('after task:before', async t => {
          t.assert.strictEqual(rows[2].alt, 'runner:render')
        })
      })
      
      await t.test('runs the task:after second from last', async t => {
        t.assert.strictEqual(rows.at(-2).alt, 'task:after')
      })
      
      await t.test('runs "runner:after", last', async t => {
        t.assert.strictEqual(rows.at(-1).alt, 'runner:after')
      })
    })
  })
})
