import assert from 'node:assert'
import { test } from 'node:test'

test('Runnable example', async t => {
  await t.test('runs without errors', async () => {
    await assert.doesNotReject(() => {
      return import(`../../.github/example/index.js?bust_cache=${Date.now()}`)
    })
  })

  await t.test('logs to console', async t => {
    let logs

    console.log = (...args) =>
      args.every(arg => typeof arg === 'string') ?
          logs.push(args.join(' ')) : null

    await t.beforeEach(() => {
      logs = []

      return import(`../../.github/example/index.js?bust_cache=${Date.now()}`)
    })

    await t.test('at least 3 string-only logs', () => {
      assert.ok(logs.length >= 3, `length is actually: ${logs.length}`)
    })

    await t.test('1st log is a "repo.save()" success message', () => {
      assert.strictEqual(
        logs.at(0),
        'saved: Building with id: kensington',
        `logs.0 actually equals: "${logs.at(0)}"`
      )
    })

    await t.test('2nd log is a "repo.fetch()" success message', () => {
      assert.strictEqual(
        logs.at(1),
        'fetched: Building with id: kensington',
        `logs.1 actually equals: "${logs.at(1)}"`
      )
    })

    await t.test('3rd log is a "building.flats.0.doorbell()" message', () => {
      assert.strictEqual(
        logs.at(2),
        '🔔 at flat: 101',
        `logs.2 actually equals: "${logs.at(2)}"`
      )
    })
  })
})
