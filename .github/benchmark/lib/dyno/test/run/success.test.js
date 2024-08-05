import test from 'node:test'
import { join } from 'node:path'

import { dyno } from '../../index.js'

test('#dyno(): run until test duration elapses', async t => {
  let result 

  t.beforeEach(async () => {
    console.info = () => { }
    result = await dyno({
      task: join(import.meta.dirname, 'tasks/record-histogram.js'),
      parameters: { 
        CYCLES_PER_SECOND: 100, 
        CONCURRENCY: 2, 
        DURATION_MS: 500, 

        FOO: 5,
        BAR: 10
      }
    })
  })
  
  await t.test('returns a result 1', t => {
    t.assert.ok(result
    )
    console.log(result)
  })
})
