import assert from 'node:assert'
import { test } from 'node:test'

import { fileURLToPath } from 'node:url'
import { resolve, dirname } from 'node:path'

import { promisify } from 'node:util'
import { exec as execCb } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const filepath = resolve(__dirname, '../index.js')
const exec = promisify(execCb)

test('Runnable example', async t => {
  await t.test('logs output:', async t => {
    let stdouts = '', stderrs = ''

    const { stdout, stderr } = await exec(`node ${filepath}`, { timeout: 5000 })

    stdouts += stdout.toString()
    stderrs += stderr.toString()

    assert.ok(stdouts.length > 1)

    await t.test('non-errors', () => {
      assert.strictEqual(stderrs.length, 0)
    })

    await t.test('a "save()" success log', () => {
      assert.ok(stdouts.includes('saved'))
    })

    await t.test('a "fetch()" success log', () => {
      assert.ok(stdouts.includes('fetched'))
    })

    await t.test('a "LazyList" log', () => {
      assert.ok(stdouts.includes('has'))
      assert.ok(stdouts.includes('2'))
      assert.ok(stdouts.includes('flats'))
    })

    await t.test('a "LazyList item method called" log', () => {
      assert.ok(stdouts.includes('🔔'))
      assert.ok(stdouts.includes('at flat'))
    })

    await t.test('an "AppendList" log', () => {
      assert.ok(stdouts.includes('has'))
      assert.ok(stdouts.includes('50'))
      assert.ok(stdouts.includes('mails'))
    })
  })
})
