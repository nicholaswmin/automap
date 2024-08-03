import test from 'node:test'
import { join } from 'node:path'
import { Dyno } from '../../index.js'

test('hooks:#render()', async t => {
  let dyno, renderFnMock = t.mock.fn(() => {})

  t.before(async () => {
    dyno = new Dyno({
      task: join(import.meta.dirname, 'tasks/add-db-rows.js'),
      parameters: {
        TASKS_SECOND: 1,
        THREAD_COUNT: 1,
        TEST_SECONDS: 3
      },

      render: renderFnMock
    })

    await dyno.start()
  })

  await t.test('is called', async t => {
    t.assert.ok(renderFnMock.mock.calls.length > 0, 'renderFnMock() not called')
  })
  
  await t.test('with arguments', async t => {
    const args = renderFnMock.mock.calls[0].arguments
    
    await t.test('at least 1 argument', async t => {
      t.assert.ok(args.length > 0, 'no arguments passed')
      
      await t.test('which is an object', async t => {
        const type = typeof args[0]

        t.assert.ok(type === 'object', `expected: object, got: ${type}`)
      })
      
      await t.test('"runner"', async t => {
        await t.test('has a "runner" property', t => {
          t.assert.ok(Object.hasOwn(args[0], 'runner'), 'no prop: "runner"')
        })
  
        await t.test('which is an object', async t => {
          const type = typeof args[0].runner
  
          t.assert.ok(type === 'object', `expected: object, got: ${type}`)
        })
      })
      
      await t.test('"threads"', async t => {
        await t.test('has a "threads" property', t => {
          t.assert.ok(Object.hasOwn(args[0], 'threads'), 'no prop: "threads"')
        })
    
        await t.test('which is an object', async t => {
          const type = typeof args[0].threads
  
          t.assert.ok(type === 'object', `expected: object, got: ${type}`)
        })
      })
    })
  })
})
