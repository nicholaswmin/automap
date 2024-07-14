import assert from 'node:assert'
import { test } from 'node:test'

import capcon from 'capture-console'

test('Runnable example', async t => {
  const logs = []

  await t.before(() => capcon.startCapture(process.stdout, stdout => {
    // eslint-disable-next-line no-control-regex
    const stripAnsi = str => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    logs.push(stripAnsi(stdout.toString()))
  }))

  await t.after(() => capcon.stopCapture(process.stdout))
  await t.beforeEach(() => logs.splice(0, logs.length))

  await t.test('runs without errors', async () => {
    await assert.doesNotReject(() =>
      import(`../index.js?bust_cache=${Date.now()}`))
  })

  await t.test('logs to console', async t => {
    await t.beforeEach(() =>
      import(`../index.js?bust_cache=${Date.now()}`))

    await t.test('logs a save() success log', () => {
      assert.ok(logs.some(log => log.includes('Building saved')))
    })

    await t.test('logs a fetch() success log', () => {
      assert.ok(logs.some(log => log.includes('Building fetched')))
    })

    await t.test('logs a LazyList success log', () => {
      assert.ok(logs.some(log => log.includes('Building has 2 flats')))
    })

    await t.test('logs a Flat method called log', () => {
      assert.ok(logs.some(log => log.includes('🔔 at flat 101')))
    })

    await t.test('logs an AppendList message', () => {
      assert.ok(logs.some(log => log.includes('Flat 101 has 50 mails')))
    })
  })
})
