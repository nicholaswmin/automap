import test from 'node:test'
import { join } from 'node:path'

import { dyno } from '../../index.js'

test('#dyno():task runtime error', async t => {
  const parameters = { 
    CYCLES_PER_SECOND: 50, CONCURRENCY: 2, DURATION_MS: 300 
  }

  t.before(async () => {
    await dyno({
      task: join(import.meta.dirname, 'tasks/throws-runtime-error.js'),
      parameters
    })
  })
  
  await t.test('error is raised in a thread', async t => {
    await t.test('shuts down remaining alive threads', t => {

    })
    
    await t.test('throws the error', t => {

    })
  })
})
