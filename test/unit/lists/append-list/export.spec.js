import assert from 'node:assert'
import { test } from 'node:test'

import { AppendList } from '../../../../src/list.js'
import { Message } from '../../../helpers/model/index.js'

test('AppendList', async t => {
  let list

  await t.test('#exportForSave', async t => {
    let result = null

    await t.test('list has non items', async t => {
      await t.beforeEach(() => {
        list = new AppendList({ from: [], type: Message })

        result = list.exportForSave('sample:path')
      })

      await t.test('returns an object', () => {
        assert.ok(result)
        assert.strictEqual(typeof result, 'object')
      })

      await t.test('with a type property', async t => {
        assert.ok(Object.hasOwn(result, 'type'))

        await t.test('set to "list"', () => {
          assert.strictEqual(result.type, 'list')
        })
      })

      await t.test('with a value property', async t => {
        assert.ok(Object.hasOwn(result, 'value'))

        await t.test('set to an Array', () => {
          assert.ok(Array.isArray(result.value))
        })

        await t.test('nothing new added to the array', async t => {
          await t.test('with no length', () => {
            assert.strictEqual(result.value.length, 0)
          })
        })
      })
    })

    await t.test('list has some items', async t => {
      await t.beforeEach(() => {
        list = new AppendList({
          from: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
          type: Message
        })

        result = list.exportForSave('sample:path')
      })

      await t.test('returns an object', () => {
        assert.ok(result)
        assert.strictEqual(typeof result, 'object')
      })

      await t.test('with a type property', async t => {
        assert.ok(Object.hasOwn(result, 'type'))

        await t.test('set to "list"', () => {
          assert.strictEqual(result.type, 'list')
        })
      })

      await t.test('with a value property', async t => {
        assert.ok(Object.hasOwn(result, 'value'))

        await t.test('set to an Array', () => {
          assert.ok(Array.isArray(result.value))
        })

        await t.test('nothing new added to the array', async t => {
          await t.test('with no length', () => {
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

          await t.test('has a length of 1', () => {
            assert.strictEqual(result.value.length, 1)
          })

          await t.test('with a result string as the new element', () => {
            assert.strictEqual(typeof result.value[0], 'string')
          })

          await t.test('which is parseable', () => {
            assert.doesNotThrow(() => JSON.parse(result.value))
          })

          await t.test('and matches the newly passed item', () => {
            assert.equal(result.value[0], JSON.stringify(message))
          })
        })
      })
    })
  })
})
