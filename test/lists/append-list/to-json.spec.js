import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { AppendList } from '../../../src/list.js'
import { Message } from '../../model/index.js'

test('AppendList', async t => {
  let list

  await t.test('#exportForSave', async t => {
    let result = null

    await t.beforeEach(t => {
      list = new AppendList({
        from: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
        type: Message
      })

      result = list.exportForSave('sample:path')
    })

    await t.test('returns an object', t => {
      assert.ok(result)
      assert.strictEqual(typeof result, 'object')
    })

    await t.test('with a type property', async t => {
      assert.ok(Object.hasOwn(result, 'type'))

      await t.test('set to "list"', t => {
        assert.strictEqual(result.type, 'list')
      })
    })

    await t.test('with a value property', async t => {
      assert.ok(Object.hasOwn(result, 'value'))

      await t.test('set to an Array', t => {
        assert.ok(Array.isArray(result.value))
      })

      await t.test('nothing new added to the array', async t => {
        await t.test('with no length', t => {
          assert.strictEqual(result.value.length, 0)
        })
      })

      await t.test('adding a new item via `#push(item)`', async t => {
        let message

        await t.beforeEach(() => {
          message = new Message({ id: 'm_3', text: 'Hola' })

          list.push(message)

          result = list.exportForSave('sample:path')
        })

        await t.test('has a length of 1', t => {
          assert.strictEqual(result.value.length, 1)
        })

        await t.test('with a result string as the new element', t => {
          assert.strictEqual(typeof result.value[0], 'string')
        })

        await t.test('which is parseable', t => {
          assert.doesNotThrow(() => JSON.parse(result.value))
        })

        await t.test('and matches the newly passed item', t => {
          assert.equal(result.value[0], JSON.stringify(message))
        })
      })
    })
  })
})
