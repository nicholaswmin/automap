import test from 'node:test'
import { join } from 'node:path'
import { createHistogram } from 'node:perf_hooks'

import { dyno } from '../../../index.js'

test('#dyno():test-duration cycles in x amount of threads', async t => {
  const histogram = createHistogram()
  const parameters = { 
    CYCLES_PER_SECOND: 300, CONCURRENCY: 2, DURATION_MS: 500 
  }

  t.before(async () => {
    const timerified_dyno = performance.timerify(dyno, { histogram })

    await timerified_dyno({
      task: join(import.meta.dirname, 'tasks/runs.js'),
      parameters
    })
  })
  
  await t.test('runs for specified duration', async t => {
    await t.test('ends soon after specified duration', t => {
      const meanMs = Math.round(histogram.mean / 1000000)
      const diff = Math.abs(meanMs - parameters.DURATION_MS)
      // @NOTE '50ms' just an abitrarily chosen value on lateness
      t.assert.ok(diff < 50, 'test run > 50ms earlier/later than specified')
    })
    
    await t.test('ends no earlier than specified duration', t => {
      const minMS = Math.round(histogram.min / 1000000)

      t.assert.ok(minMS >= parameters.DURATION_MS,
        `test ended in: ${minMS} ms, specified: ${parameters.DURATION_MS} ms`
      )
    })
  })
})