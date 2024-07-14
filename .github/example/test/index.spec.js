import assert from 'node:assert'
import { test } from 'node:test'

test('Runnable example', async t => {
  let logs = [], infoFn = null

  await t.beforeEach(async () => {
    logs = []
    infoFn = console.info
    console.log = (...args) => logs.push(args.join(' '))

    await import(`../index.js?bust_cache=${Date.now()}`)
  })

  await t.afterEach(() => console.info = infoFn)

  await t.test('runs without errors', async () => {
    await assert.doesNotReject(() => {
      return import(`../index.js?bust_cache=${Date.now()}`)
    })
  })

  await t.test('logs to console', async t => {
    await t.test('at least 5 logs', () => {
      assert.ok(logs.length >= 5, `length is actually: ${logs.length}`)
    })

    await t.test('1st log is a save() success message', () => {
      assert.strictEqual(
        logs.at(0),
        '- Building saved ...',
        `logs.0 actually equals: "${logs.at(0)}"`
      )
    })

    await t.test('2nd log is a fetch() success message', () => {
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

    await t.test('4th log is a Flat method message', () => {
      assert.strictEqual(
        logs.at(3),
        '- 🔔 at flat 101',
        `logs.3 actually equals: "${logs.at(3)}"`
      )
    })

    await t.test('5th log is an AppendList message', () => {
      assert.strictEqual(
        logs.at(4),
        '- Flat 101 has 50 mails',
        `logs.4 actually equals: "${logs.at(4)}"`
      )
    })
  })
})
