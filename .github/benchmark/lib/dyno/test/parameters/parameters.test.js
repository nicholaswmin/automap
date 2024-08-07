import test from 'node:test'
import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import * as url from 'node:url'
import path from 'node:path'

import { Dyno, prompt } from '../../index.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const filepath = path.join(__dirname, 'temp/params.json')

test('Dyno: Parameters', async t => {
  let dyno, randomId = randomUUID()

  t.after(() => {
    fs.unlinkSync(filepath)
  })

  t.beforeEach(async () => {
    dyno = new Dyno({
      task: './test/parameters/tasks/task.js',
      parameters: await prompt({
        TASKS_SECOND: 1,
        THREAD_COUNT: 1,
        DURATION_SECONDS: 1,
        RANDOM_ID: randomId,
        FOO: 30,
        BAR: 'HELLO'
      })
    })

    await dyno.start()
  })

  await t.test('propagates them to the worker', async t => {
    let file, json

    t.beforeEach(() => {
      file = fs.readFileSync(filepath, 'utf8')
      json = file ? JSON.parse(file) : null
    })

    await t.test('worker has parameters', t => {
      t.assert.ok(file, 'File does not seem to exist')
      t.assert.ok(json, 'File did not seem to get parsed into JSON')
    })

    await t.test('with correct keys', t => {
      t.assert.ok(Object.hasOwn(json, 'TASKS_SECOND'))
      t.assert.ok(Object.hasOwn(json, 'THREAD_COUNT'))
      t.assert.ok(Object.hasOwn(json, 'DURATION_SECONDS'))
      t.assert.ok(Object.hasOwn(json, 'RANDOM_ID'))
      t.assert.ok(Object.hasOwn(json, 'FOO'))
      t.assert.ok(Object.hasOwn(json, 'BAR'))
    })

    await t.test('with correct values', t => {
      t.assert.strictEqual(json.TASKS_SECOND, 1)
      t.assert.strictEqual(json.THREAD_COUNT, 1)
      t.assert.strictEqual(json.RANDOM_ID, randomId)
      t.assert.strictEqual(json.FOO, 30)
      t.assert.strictEqual(json.BAR, 'HELLO')
    })
  })
})
