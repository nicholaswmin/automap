import test from 'node:test'
import { join } from 'node:path'

import { Dyno } from '../../index.js'

test('#Dyno.start()', async t => {
  let dyno

  await t.test('task file path is invalid', t => {
    t.todo('@TODO: rejects with an Error', t => {
      t.assert.rejects(() =>{
        dyno = new Dyno({
          task: join(import.meta.dirname, 'tasks/wrong-path.js'),
          parameters: {
            TASKS_SECOND: 1,
            THREAD_COUNT: 1,
            TEST_SECONDS: 1
          }
        })
        
        return dyno.start()
      })
    })
  })
  
  await t.test('required parameter is missing', async t => {
    t.beforeEach(() => {  
      dyno = new Dyno({
        task: join(import.meta.dirname, 'tasks/do-nothing.js'),
        parameters: {
          // TASKS_SECOND: 1,
          THREAD_COUNT: 1,
          TEST_SECONDS: 1
        }
      })
    })

    await t.test('rejects with a TypeError', async t => {
      await t.assert.rejects(() => dyno.start(), { name: 'TypeError' })
    })
  })
  
  await t.test('required parameter is of wrong type', async t => {
    t.beforeEach(() => {  
      dyno = new Dyno({
        task: join(import.meta.dirname, 'tasks/do-nothing.js'),
        parameters: {
          TASKS_SECOND: 1,
          THREAD_COUNT: 1,
          TEST_SECONDS: true
        }
      })
    })

    await t.test('rejects with a TypeError', async t => {
      await t.assert.rejects(() => dyno.start(), { name: 'TypeError' })
    })
  })
  
  await t.test('required parameter is less than minimum range', async t => {
    t.beforeEach(() => {  
      dyno = new Dyno({
        task: join(import.meta.dirname, 'tasks/do-nothing.js'),
        parameters: {
          TASKS_SECOND: 1,
          THREAD_COUNT: 0,
          TEST_SECONDS: 1
        }
      })
    })

    await t.test('rejects with a RangeError', async t => {
      await t.assert.rejects(() => dyno.start(), { name: 'RangeError' })
    })
  })
  
  await t.test('required parameter is more than maximum range', async t => {
    t.beforeEach(async () => {  
      dyno = new Dyno({
        task: join(import.meta.dirname, 'tasks/do-nothing.js'),
        parameters: {
          TASKS_SECOND: 100000000,
          THREAD_COUNT: 1,
          TEST_SECONDS: 1
        }
      })
    })

    await t.test('rejects with a RangeError', async t => {
      await t.assert.rejects(() => dyno.start(), { name: 'RangeError' })
    })
  })
})
