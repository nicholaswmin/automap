import test from 'node:test'
import { join } from 'node:path'

import { dyno } from '../../../index.js'

test('#dyno():error-handling shuts down gracefully on error', async t => {
  const parameters = {
    CYCLES_PER_SECOND: 50, CONCURRENCY: 4, DURATION_MS: 500
  }

  await t.test('error thrown in thread while its executing cycles', async t => {
    await t.test('dyno() call rejects with an error', async t => {
      return t.assert.rejects(async () => {
        return dyno({
          task: join(import.meta.dirname, './tasks/exits-1.js'),
          parameters
        })
      }, { name: 'Error' })
    })
    
    await t.test('dyno() call rejects immediately', async t => {
      const start = performance.now()

      return dyno({
        task: join(import.meta.dirname, './tasks/exits-1.js'),
        parameters: parameters
      })
      .catch(() => {
        const duration = performance.now() - start

        t.assert.ok(
          duration < parameters.DURATION_MS,
          [
            `Expected to rejected earlier than: ${parameters.DURATION_MS} ms`,
            `Rejected in: ${duration} ms`
          ].join('. '),
        )
      })
    })

    await t.test('gracefully disconnects the remaining threads', async t => {
      const parameters = {
        CYCLES_PER_SECOND: 50, CONCURRENCY: 4, DURATION_MS: 500
      }

      const remaining = parameters.CONCURRENCY - 1

      return t.assert.rejects(async () => {
        return dyno({
          task: join(import.meta.dirname, './tasks/exits-1.js'),
          parameters
        })
      }, { 
        message: `A thread exited with: 1. ${remaining} threads disconnected` 
      })
    })
  })
})
