import test from 'node:test'
import { join } from 'node:path'

import { dyno } from '../../index.js'

test('#dyno(): run until test duration elapses', async t => {
  let result 

  t.beforeEach(async () => {
    result = await dyno({
      task: join(import.meta.dirname, 'tasks/write-stdout.js'),
      parameters: { 
        TASKS_PER_SECOND: 1, THREAD_COUNT: 2, TEST_SECONDS: 1 , FOO: 'BAR'
      },
      render: function() {}
    })
  })

  await t.test('returns a result', t => {
    t.assert.ok(result)
  })
})
