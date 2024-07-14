import assert from 'node:assert'
import { test } from 'node:test'

import capcon from 'capture-console'

// eslint-disable-next-line no-control-regex
const stripAnsi = str => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')

test('Runnable example', async t => {
  let logs = []

  await t.beforeEach(() => {
    logs = []

    capcon.startCapture(process.stdout, stdout => {
      logs.push(stripAnsi(stdout.toString()))
    })
  })

  await t.afterEach(() => {
    capcon.stopCapture(process.stdout)
  })

  await t.test('runs without errors', async () => {
    await assert.doesNotReject(async () => {
      await import(`../index.js?bust_cache=${Date.now()}`)
    })
  })

  await t.test('logs to console', async t => {
    await t.beforeEach(async () => {
      await import(`../index.js?bust_cache=${Date.now()}`)
    })

    await t.test('logs a save() success message', () => {
      assert.ok(logs.some(log => log.includes('Building saved')))
    })

    await t.test('logs a fetch() success message', () => {
      assert.ok(logs.some(log => log.includes('Building fetched')))
    })

    await t.test('logs a LazyList success message', () => {
      assert.ok(logs.some(log => log.includes('Building has 2 flats')))
    })

    await t.test('logs a Flat method called message', () => {
      assert.ok(logs.some(log => log.includes('🔔 at flat 101')))
    })

    await t.test('logs an AppendList message', () => {
      assert.ok(logs.some(log => log.includes('Flat 101 has 50 mails')))
    })
  })
})
