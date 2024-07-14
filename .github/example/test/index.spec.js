import assert from 'node:assert'
import { test } from 'node:test'

test('Runnable example', async t => {
  const logs = [], originalLogFn = console.log

  await t.before(() =>
    console.log = (...args) =>
      logs.push(args.join(' ')))

  await t.after(() => console.log = originalLogFn)

  await t.beforeEach(() => logs.splice(0, logs.length))

  await t.test('runs without errors', async () => {
    await assert.doesNotReject(() =>
      import(`../index.js?bust_cache=${Date.now()}`))
  })

  await t.test('logs to console', async t => {
    await t.beforeEach(() =>
      import(`../index.js?bust_cache=${Date.now()}`))

    await t.test('a save() success log', () => {
      assert.ok(logs.some(log => log.includes('Building saved')))
    })

    await t.test('a fetch() success log', () => {
      assert.ok(logs.some(log => log.includes('Building fetched')))
    })

    await t.test('a LazyList success log', () => {
      assert.ok(logs.some(log => log.includes('Building has 2 flats')))
    })

    await t.test('a Flat method called log', () => {
      assert.ok(logs.some(log => log.includes('🔔 at flat 101')))
    })

    await t.test('an AppendList log', () => {
      assert.ok(logs.some(log => log.includes('Flat 101 has 50 mails')))
    })
  })
})
