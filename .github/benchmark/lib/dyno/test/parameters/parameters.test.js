import test from 'node:test'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import * as url from 'node:url'
import path from 'node:path'

import { Dyno, configure } from '../../index.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const filepath = path.join(__dirname, 'temp/params.json')

test('parameters propagate to the worker', async t => {
  let dyno, randomId = randomUUID()

  t.after(() => {
    fs.unlinkSync(filepath)
  })

  t.beforeEach(async () => {
    dyno = new Dyno({
      task: './test/parameters/task.js',
      parameters: await configure({
        TASKS_SECOND: 10,
        THREAD_COUNT: 2,
        DURATION_SECONDS: 2,
        RANDOM_ID: randomId,
        FOO: 30,
        BAR: 'HELLO'
      })
    })

    await dyno.start()
  })

  await t.test('who then saves them in a file', async t => {
    let file, json

    t.beforeEach(() => {
      file = fs.readFileSync(filepath, 'utf8')
      json = file ? JSON.parse(file) : null
    })

    await t.test('who then saves them in a file', t => {
      t.assert.ok(file, 'File does not seem to exist')
      t.assert.ok(json, 'File did not seem to get parsed into JSON')
    })

    await t.test('the saved files contains the same parameters', t => {
      t.assert.ok(Object.hasOwn(json, 'TASKS_SECOND'))
      t.assert.ok(Object.hasOwn(json, 'THREAD_COUNT'))
      t.assert.ok(Object.hasOwn(json, 'DURATION_SECONDS'))
      t.assert.ok(Object.hasOwn(json, 'RANDOM_ID'))
      t.assert.ok(Object.hasOwn(json, 'FOO'))
      t.assert.ok(Object.hasOwn(json, 'BAR'))
    })

    await t.test('with the same values', t => {
      t.assert.strictEqual(json.TASKS_SECOND, 10)
      t.assert.strictEqual(json.THREAD_COUNT, 2)
      t.assert.strictEqual(json.DURATION_SECONDS, 2)
      t.assert.strictEqual(json.RANDOM_ID, randomId)
      t.assert.strictEqual(json.FOO, 30)
      t.assert.strictEqual(json.BAR, 'HELLO')
    })
  })
})
