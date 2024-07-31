import test from 'node:test'

import TaskTable from '../../../src/stats/views/task-table.js'
import rows from './rows.json' with { type: 'json' }

test('view: task-table', async t => {
  let table = null

  t.before(async () => {
    table = new TaskTable({
      stats: {
        sortby: 'backlog.max',
        labels: {
          logged: [
            ['task.count', 'tasks run'],
            ['memory.mean', 'memory (mean/mb)'],
            ['gc.mean', 'GC duration (mean/ms)'],
            ['gc.count', 'GC cycles'],
            ['backlog.max', 'max backlog']
          ]
        }
      },
      measures: {
        sortby: 'task.mean',
        labels: {
          plotted: [['task'], ['redis_ping', 'latency'], ['fetch'], ['save']],
          logged: [
            ['task.mean', 'task (mean/ms)'],
            ['redis_ping.mean', 'latency (mean/ms)'],
            ['fetch.mean', 'fetch (mean/ms)'],
            ['save.mean', 'save (mean/ms)']
          ]
        }
      }
    }, rows)

    table.compute()
  })

  await t.test('computes stats for each thread', async t => {
    await t.test('threads is an array', t => {
      console.log(table.threads)
      t.assert.ok(
        Array.isArray(table.threads), 
        `table.threads is: "${typeof table.threads}", which is not an array`
      )
    })
    
    await t.test('thread stats', async t => {
      await t.test('has a row for each thread', async t => {
        t.assert.strictEqual(table.threads[0].length, 4)
      })
      
      await t.test('backlog stats ', async t => {        
        await t.test('has a max backlog property', async t => {
          t.assert.ok(Object.hasOwn(table.threads[0][0], 'max backlog'))
        })
        
        await t.test('has max backlog value', async t => {
          t.assert.strictEqual(table.threads[0][0]['max backlog'], 1)
        })
      })  
    })
    
    await t.test('thread measures', async t => {
      await t.test('has a row for each thread', async t => {
        t.assert.strictEqual(table.threads[1].length, 4)
      })
      
      await t.test('task timings ', async t => {        
        await t.test('has task timings property', async t => {
          t.assert.ok(Object.hasOwn(table.threads[1][0], 'task (mean/ms)'))
        })
        
        await t.test('has task timing value in ms', async t => {
          t.assert.strictEqual(table.threads[1][0]['task (mean/ms)'], 11.5)
        })
      })
      
      await t.test('fetch timings ', async t => {        
        await t.test('has fetch timings property', async t => {
          t.assert.ok(Object.hasOwn(table.threads[1][0], 'fetch (mean/ms)'))
        })
        
        await t.test('has fetch timing value in ms', async t => {
          t.assert.strictEqual(table.threads[1][0]['fetch (mean/ms)'], 6)
        })
      })
      
      await t.test('save timings ', async t => {        
        await t.test('has save timings property', async t => {
          t.assert.ok(Object.hasOwn(table.threads[1][0], 'save (mean/ms)'))
        })
        
        await t.test('has save timing value in ms', async t => {
          t.assert.strictEqual(table.threads[1][0]['save (mean/ms)'], 2)
        })
      })  
    })
  })
})
