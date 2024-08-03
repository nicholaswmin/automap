import test from 'node:test'
import fs from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { Dyno } from '../../index.js'

const filepath = join(import.meta.dirname, 'temp/params.json')

test('Dyno: parameters:static', async t => {
  let dyno, RANDOM_ID = randomUUID()

  t.after(() => {
    fs.unlinkSync(filepath)
  })

  t.before(async () => {
    dyno = new Dyno({
      task: join(import.meta.dirname, 'tasks/params-to-file.js'),
      parameters: {
        TASKS_SECOND: 1,
        THREAD_COUNT: 1,
        TEST_SECONDS: 1,
        RANDOM_ID,
        FOO: 30,
        BAR: 'HELLO'
      }
    })

    await dyno.start()
  })

  await t.test('propagates them to the worker', async t => {
    let file, json

    t.beforeEach(() => {
      file = fs.readFileSync(filepath, 'utf8')
      json = file ? JSON.parse(file) : null
    })

    t.todo('does not prompt the user to edit them', () => {
      // @TODO
      // this is incorrect; `prompt()` checks for `NODE_ENV === 'test` and
      // always suppresses user prompt so this will always pass regardless
    })

    await t.test('worker has parameters', t => {
      t.assert.ok(file, 'File does not seem to exist')
      t.assert.ok(json, 'File did not seem to get parsed into JSON')
    })

    await t.test('with correct keys', t => {
      t.assert.ok(Object.hasOwn(json, 'TASKS_SECOND'))
      t.assert.ok(Object.hasOwn(json, 'THREAD_COUNT'))
      t.assert.ok(Object.hasOwn(json, 'TEST_SECONDS'))
      t.assert.ok(Object.hasOwn(json, 'RANDOM_ID'))
      t.assert.ok(Object.hasOwn(json, 'FOO'))
      t.assert.ok(Object.hasOwn(json, 'BAR'))
    })

    await t.test('with correct values', t => {
      t.assert.strictEqual(json.TASKS_SECOND, 1)
      t.assert.strictEqual(json.THREAD_COUNT, 1)
      t.assert.strictEqual(json.RANDOM_ID, RANDOM_ID)
      t.assert.strictEqual(json.FOO, 30)
      t.assert.strictEqual(json.BAR, 'HELLO')
    })
  })
})
