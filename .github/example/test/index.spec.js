import assert from 'node:assert'
import { test } from 'node:test'

test('Runnable example', async t => {
  let logs = []

  await t.beforeEach(async () => {
    logs = []

    await import(`../index.js?bust_cache=${Date.now()}`)

    console.info = (...args) => logs.push(args.join(' '))
  })

  await t.test('runs without errors', async () => {
    await assert.doesNotReject(() => {
      return import(`../index.js?bust_cache=${Date.now()}`)
    })
  })

  await t.test('logs to console', async t => {
    await t.test('at least 5 logs', () => {
      assert.ok(logs.length >= 5, `length is actually: ${logs.length}`)
    })

    await t.test('1st log is a "save()" success message', () => {
      assert.strictEqual(
        logs.at(0),
        '- Building saved ...',
        `logs.0 actually equals: "${logs.at(0)}"`
      )
    })

    await t.test('2nd log is a "fetch()" success message', () => {
      assert.strictEqual(
        logs.at(1),
        '- Building fetched ...',
        `logs.1 actually equals: "${logs.at(1)}"`
      )
    })

    await t.test('3rd log is a LazyList message', () => {
      assert.strictEqual(
        logs.at(2),
        '- Building has 2 flats',
        `logs.2 actually equals: "${logs.at(2)}"`
      )
    })

    await t.test('4th log is an `AppendList` message', () => {
      assert.strictEqual(
        logs.at(3),
        '- Flat 101 has 50 mails',
        `logs.2 actually equals: "${logs.at(3)}"`
      )
    })
  })
})
