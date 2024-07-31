import test from 'node:test'

import PrimaryTable from '../../../src/stats/views/primary-table.js'
import rows from './rows.json' with { type: 'json' }

test('view: primary-table', async t => {
  let table = null

  t.before(async () => {
    table = new PrimaryTable([
      ['sent.count', 'tasks sent'],
      ['replies.count', 'tasks acked'],
      ['memory.mean', 'memory (mean/mb)'],
      ['uptime.count', 'uptime seconds']
    ], rows)
    
    table.compute()
  })

  await t.test('computes stats', async t => {
    await t.test('has stats', async t => {
      t.assert.ok(table.stats)
    })

    await t.test('stats is an array', t => {
      console.log(table.stats)
      t.assert.ok(
        Array.isArray(table.stats), 
        `table.stats is: "${typeof table.stats}", which is not an array`
      )
    })
    
    await t.test('with one item', async t => {
      t.assert.strictEqual(table.stats.length, 1)
    })
      
    await t.test('includes "tasks sent" stats', async t => {
      await t.test('has "tasks sent" key', async t => {
        t.assert.ok(Object.hasOwn(table.stats[0], 'tasks sent'))
      })
      
      await t.test('has correct "tasks sent" value', async t => {
        t.assert.strictEqual(table.stats[0]['tasks sent'], 9)
      })
    })
    
    await t.test('includes "tasks acked" stats', async t => {
      await t.test('has "tasks acked" key', async t => {
        t.assert.ok(Object.hasOwn(table.stats[0], 'tasks acked'))
      })
      
      await t.test('has correct "tasks acked" value', async t => {
        t.assert.strictEqual(table.stats[0]['tasks acked'], 2)
      })
    })
    
    await t.test('includes "memory" stats', async t => {
      await t.test('has "memory (mean/mb)" key', async t => {
        t.assert.ok(Object.hasOwn(table.stats[0], 'tasks acked'))
      })
      
      await t.test('has correct "memory (mean/mb)" value', async t => {
        t.assert.ok(
          table.stats[0]['memory (mean/mb)'] > 0, 
          'memory (mean/mb) is not above 0'
        )
      })
    })
    
    await t.test('has "uptime" property', async t => {
      await t.test('has "uptime seconds" key', async t => {
        t.assert.ok(Object.hasOwn(table.stats[0], 'uptime seconds'))
      })
      
      await t.test('has correct "uptime seconds" value', async t => {
        t.assert.strictEqual(table.stats[0]['uptime seconds'], 8)
      })
    })
  })
})
