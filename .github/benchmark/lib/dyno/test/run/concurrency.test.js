import test from 'node:test'
import { join } from 'node:path'
import { createHistogram } from 'node:perf_hooks'

import { dyno } from '../../index.js'

test('#dyno():concurrency', async t => {
  let result = null
  const parameters = { 
    CYCLES_PER_SECOND: 300, CONCURRENCY: 2, DURATION_MS: 500 
  }

  t.before(async () => {
    result = await dyno({
      task: join(import.meta.dirname, 'tasks/records-value.js'),
      parameters
    })
  })

  await t.test('returns an object', async t => {
    const pids = Object.keys(result).sort((a, b) => a - b) 
    const t1 = result[pids[1]], t2 = result[pids[2]]
  
    await t.test('with 1 property per-thread', async t => {
      await t.test('spawns at least 1 thread', async t => {
        t.assert.ok(pids.length > 0, 'result has 0 threads')
      })

      await t.test('1st property is the main process', async t => {
        t.assert.strictEqual(pids[0], process.pid.toString())
      })
    })
    
    await t.test('with child thread measurements', async t => {
      await t.test('spawns specified number of threads', async t => {
        t.assert.strictEqual(pids.length, parameters.CONCURRENCY + 1)
      })

      await t.test('each thread runs at least 1 cycle', t => {
        t.assert.ok(Object.hasOwn(t1, 'cycle'), 'thread 1 did not log a cycle')
        t.assert.ok(Object.hasOwn(t2, 'cycle'), 'thread 2 did not log a cycle')
      })
  
      await t.test('each is run for a number of cycles', async t => {
        await t.test('thread_1 run > 50 cycles', async t => {
          t.assert.ok(result[pids[1]]['cycle']['count'] > 50)
        })

        await t.test('thread_2 run > 50 cycles', async t => {
          t.assert.ok(result[pids[2]]['cycle']['count'] > 50)
        })
      })
  
      await t.test('threads run an approx. equal number of cycles', t => {
        const diff = Math.abs(t1['cycle']['count'] - t2['cycle']['count'])
        
        t.diagnostic(`t1-t2 cycle count difference is: ${diff}`)

        t.assert.ok(diff < 30, 'child threads call-count diff. is > 30') 
      })
    })
  })
})
