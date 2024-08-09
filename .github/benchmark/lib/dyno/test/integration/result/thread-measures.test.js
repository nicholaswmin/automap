import test from 'node:test'
import { join } from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno() value recorded in task', async t => {
  let result = null, task, parameters = { 
    CYCLES_PER_SECOND: 200, CONCURRENCY: 2, DURATION_MS: 1000 
  }

  t.before(async () => {
    result = await dyno({
      task: join(import.meta.dirname, 'tasks/records-foo.js'),
      parameters
    })
    
    const pids = Object.keys(result).sort((a, b) => a - b) 

    task = result[pids[1]]
  })

  await t.test('tracks the measurement', async t => {
    t.assert.ok(Object.hasOwn(task, 'foo'), 
      'Cannot find tracked measurement "foo" on thread'
    )
  })

  await t.test('records in a histogram it"s recorded values', async t => {
    t.assert.strictEqual(task.foo.count, 10)
    t.assert.strictEqual(task.foo.min, 1)
    t.assert.strictEqual(task.foo.mean, 5.5)
    t.assert.strictEqual(task.foo.max, 10)
  })
  
  await t.test('records snapshots of the histogram', async t => {
    t.assert.strictEqual(task.foo.snapshots.at(-1).count, 10)
    t.assert.strictEqual(task.foo.snapshots.at(-1).min, 1)
    t.assert.strictEqual(task.foo.snapshots.at(-1).mean, 5.5)
    t.assert.strictEqual(task.foo.snapshots.at(-1).max, 10)
  })
  
  await t.test('records 1 snapshot each time a value is recorded', async t => {
    t.assert.strictEqual(task.foo.snapshots.length, 10)
  })
})
