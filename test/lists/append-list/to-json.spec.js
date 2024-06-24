import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { AppendList } from '../../../src/list.js'
import { Message } from '../../model/index.js'

test('AppendList', async t => {
  let list

  await t.test('#exportForSave', async t => {
    let json = null

    await t.beforeEach(t => {
      list = new AppendList({
        items: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
        construct: item => new Message(item)
      })

      json = list.exportForSave('sample:path')
    })

    await t.test('returns an object', t => {
      assert.ok(json)
      assert.strictEqual(typeof json, 'object')
    })

    await t.test('with a key property', async t => {
      assert.ok(Object.hasOwn(json, 'key'))

      await t.test('set to the passed path', t => {
        assert.strictEqual(json.key, 'sample:path')
      })
    })

    await t.test('with a type property', async t => {
      assert.ok(Object.hasOwn(json, 'type'))

      await t.test('set to "list"', t => {
        assert.strictEqual(json.type, 'list')
      })
    })

    await t.test('with a value property', async t => {
      assert.ok(Object.hasOwn(json, 'value'))

      await t.test('set to an Array', t => {
        assert.ok(Array.isArray(json.value))
      })

      await t.test('nothing new added to the array', async t => {
        await t.test('with no length', t => {
          assert.strictEqual(json.value.length, 0)
        })
      })

      await t.test('adding a new item via `#push(item)`', async t => {
        let message

        await t.beforeEach(() => {
          message = new Message({ id: 'm_3', text: 'Hola' })

          list.push(message)

          json = list.exportForSave('sample:path')
        })

        await t.test('has a length of 1', t => {
          assert.strictEqual(json.value.length, 1)
        })

        await t.test('with a json string as the new element', t => {
          assert.strictEqual(typeof json.value[0], 'string')
        })

        await t.test('which is parseable', t => {
          assert.doesNotThrow(() => JSON.parse(json.value))
        })

        await t.test('and matches the newly passed item', t => {
          assert.equal(json.value[0], JSON.stringify(message))
        })
      })
    })
  })
})
