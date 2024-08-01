import test from 'node:test'

import ThreadTable from '../../../src/stats/views/thread-table.js'
import rows from './rows.json' with { type: 'json' }

test('view: task-table', async t => {
  let table = null

  t.before(async () => {
    table = new ThreadTable({
      sortby: 'task.mean',
      plotted: [['task'], ['redis_ping', 'latency'], ['fetch'], ['save']],
      tabular: [
        ['backlog.max', 'max backlog'],
        ['task.mean', 'task'],
        ['fetch.mean', 'fetch'],
        ['save.mean', 'save']
      ]
    }, rows)

    table.compute()
  })

  await t.test('computes stats for each thread', async t => {
    await t.test('threads is an array', t => {
      t.assert.ok(
        Array.isArray(table.threads), 
        `table.threads is: "${typeof table.threads}", which is not an array`
      )
    })
    
    await t.test('thread stats', async t => {
      await t.test('has a row for each thread', async t => {
        t.assert.strictEqual(table.threads.length, 3)
      })
      
      await t.test('backlog stats ', async t => {        
        await t.test('has a max backlog property', async t => {
          t.assert.ok(Object.hasOwn(table.threads[0], 'max backlog'))
        })
        
        await t.test('has max backlog value', async t => {
          t.assert.strictEqual(table.threads[0]['max backlog'], 1)
        })
      })
      
      await t.test('task timings ', async t => {        
        await t.test('has task timings property', async t => {
          t.assert.ok(Object.hasOwn(table.threads[1], 'task'))
        })
        
        await t.test('has task timing value in ms', async t => {
          t.assert.strictEqual(table.threads[1]['task'], 7.5)
        })
      })
      
      await t.test('fetch timings ', async t => {        
        await t.test('has fetch timings property', async t => {
          t.assert.ok(Object.hasOwn(table.threads[1], 'fetch'))
        })
        
        await t.test('has fetch timing value in ms', async t => {
          t.assert.strictEqual(table.threads[1]['fetch'], 5.5)
        })
      })
      
      await t.test('save timings ', async t => {        
        await t.test('has save timings property', async t => {
          t.assert.ok(Object.hasOwn(table.threads[1], 'save'))
        })
        
        await t.test('has save timing value in ms', async t => {
          t.assert.strictEqual(table.threads[1]['save'], 1.5)
        })
      })  
    })
  })
})
