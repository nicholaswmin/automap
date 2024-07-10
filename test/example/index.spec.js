import assert from 'node:assert'
import { test } from 'node:test'

test('Example', async t => {
  const logs = []
  console.log = (...args) => logs.push(args)

  await t.test('logs to console', async t => {
    await t.beforeEach(async () => {
      await import('../../.github/example/index.js')
    })

    await t.test('logs to console at least 3 times', () => {
      assert.ok(logs.length >= 3)
    })

    await t.test('logs a saved message', () => {
      const log = logs[0].join(' ')

      assert.strictEqual(log, 'saved: Building with id: kensington')
    })

    await t.test('logs a fetched message', () => {
      const log = logs[1].join(' ')

      assert.strictEqual(log, 'fetched: Building with id: kensington')
    })

    await t.test('logs a method call message', () => {
      const log = logs[2].join(' ')

      assert.strictEqual(log, '🔔 at flat: 101')
    })
  })
})
