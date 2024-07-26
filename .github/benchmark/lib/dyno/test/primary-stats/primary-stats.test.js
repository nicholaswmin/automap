import test from 'node:test'
import { randomUUID } from 'node:crypto'

import { Dyno, configure } from '../../index.js'
import { resetDB } from '../utils/sqlite.js'

test('primary stats', async t => {
  let dyno = null, result = null, randomId = randomUUID()

  t.before(async () => {
    resetDB()

    dyno = new Dyno({
      task: './test/primary-stats/task.js',
      parameters: await configure({
        TASKS_SECOND: 20,
        THREAD_COUNT: 2,
        DURATION_SECONDS: 5,
        RANDOM_ID: randomId
      })
    })

    result = await dyno.start()
  })

  await t.test('sending 20 tasks per second for 5 second', async t => {
    await t.test('produces a result', async t => {
      t.assert.ok(result)
    })

    await t.test('produces a result with:', async t => {
      t.assert.ok(Object.hasOwn(result, 'primary'))

      await t.test('the count of tasks sent', async t => {
        t.assert.ok(Object.hasOwn(result.primary, 'sent'))
        t.assert.ok(result.primary.sent.length > 5, result.primary.sent.length)

        await t.test('last count sums up correctly', async t => {
          const last = result.primary.sent.at(-1)

          t.assert.ok(last.count > 90, `${last} is not > 90`)
          t.assert.ok(last.count < 120, `${last} is not < 120`)
        })

        await t.test('in a histogram format', async t => {
          const row = result.primary.sent[0]
          t.assert.ok(Object.hasOwn(row, 'count'))
          t.assert.ok(Object.hasOwn(row, 'min'))
          t.assert.ok(Object.hasOwn(row, 'mean'))
          t.assert.ok(Object.hasOwn(row, 'max'))

          await t.test('with valid values', async t => {
            const last = result.primary.sent.at(-1)

            t.assert.strictEqual(typeof last.count, 'number')
            t.assert.ok(last.count > 0, `count: ${last.count} not > 0`)

            t.assert.strictEqual(typeof last.min, 'number')
            t.assert.ok(last.min > 0, `min: ${last.min} not > 0`)

            t.assert.strictEqual(typeof row.mean, 'number')
            t.assert.ok(last.mean > 0, `mean: ${row.mean} not > 0`)

            t.assert.strictEqual(typeof row.max, 'number')
            t.assert.ok(last.max > 0, `mean: ${last.max} not > 0`)
          })
        })
      })
    })

    await t.test('the count of replies from the workers', async t => {
      t.assert.ok(Object.hasOwn(result.primary, 'replies'))
      t.assert.ok(result.primary.replies.length > 5)

      await t.test('last count sums up correctly', async t => {
        const last = result.primary.replies.at(-1)

        t.assert.ok(last.count > 90, `${last} is not > 90`)
        t.assert.ok(last.count < 120, `${last} is not < 120`)
      })

      await t.test('in a histogram format', async t => {
        const last = result.primary.replies.at(-1)
        t.assert.ok(Object.hasOwn(last, 'count'))
        t.assert.ok(Object.hasOwn(last, 'min'))
        t.assert.ok(Object.hasOwn(last, 'mean'))
        t.assert.ok(Object.hasOwn(last, 'max'))

        await t.test('with valid values', async t => {
          const last = result.primary.replies.at(-1)

          t.assert.strictEqual(typeof last.count, 'number')
          t.assert.ok(last.count > 0, `count: ${last.count} not > 0`)

          t.assert.strictEqual(typeof last.min, 'number')
          t.assert.ok(last.min > 0, `min: ${last.min} not > 0`)

          t.assert.strictEqual(typeof last.mean, 'number')
          t.assert.ok(last.mean > 0, `mean: ${last.mean} not > 0`)

          t.assert.strictEqual(typeof last.max, 'number')
          t.assert.ok(last.max > 0, `mean: ${last.max} not > 0`)
        })
      })
    })
  })
})
