import assert from 'node:assert'
import { test } from 'node:test'

test('Runnable example', async t => {
  const logs = [], consoleLog = console.log

  await t.before(() =>
    console.log = (...args) =>
      logs.push(args.join(' ')))

  await t.after(() => console.log = consoleLog)

  await t.beforeEach(() => logs.splice(0, logs.length))

  await t.test('runs without errors', async () => {
    await assert.doesNotReject(() =>
      import(`../index.js?bust_cache=${Date.now()}`))
  })

  await t.test('logs to console', async t => {
    await t.beforeEach(() =>
      import(`../index.js?bust_cache=${Date.now()}`))

    await t.test('a save() log', () => {
      assert.ok(logs.some(log => log.includes('saved')))
    })

    await t.test('a fetch() log', () => {
      assert.ok(logs.some(log => log.includes('fetched')))
    })

    await t.test('a LazyList log', () => {
      assert.ok(logs.some(log => log.includes('has 2 flats')))
    })

    await t.test('a Flat method called log', () => {
      assert.ok(logs.some(log => log.includes('🔔 at flat')))
    })

    await t.test('an AppendList log', () => {
      assert.ok(logs.some(log => log.includes('has 50 mails')))
    })
  })
})
