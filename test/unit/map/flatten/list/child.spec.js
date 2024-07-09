import assert from 'node:assert'
import { test } from 'node:test'

import { flatten } from '../../../../../src/map.js'
import { Chatroom } from '../../../../model/index.js'

test('#flatten()', async t => {
  let chatroom

  await t.beforeEach(() => {
    chatroom = new Chatroom({
      id: 'c_1',
      messages: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
      users: [
        { id: 'u_1', name: 'John', notes: [{ id: 'n_1', text: 'foo' }] },
        { id: 'u_2', name: 'Mary', notes: [{ id: 'n_2', text: 'bar' }] }
      ]
    })
  })

  await t.test('Nested List - value', async t => {
    let list = null

    t.beforeEach(() => {
      const result = flatten(chatroom)

      list = result.lists
        .find(item => item.key === 'chatroom:c_1:users:u_1:notes')
    })

    await t.test('value has key matching the path of the list', () => {
      assert.strictEqual(list.key, 'chatroom:c_1:users:u_1:notes')
    })

    await t.test('value has type set to "hash"', () => {
      assert.strictEqual(list.type, 'hash')
    })

    await t.test('value of value is an Object', () => {
      assert.ok(typeof list.value === 'object')
    })

    await t.test('k/v pairs in object match the referenced array items', () => {
      assert.strictEqual(Object.keys(list.value).length, 1)
    })

    await t.test('each key in value maps to an id of an array item', () => {
      assert.deepStrictEqual(Object.keys(list.value), ['n_1'])
    })

    await t.test('note 1 has an index at 0', () => {
      const parsed = JSON.parse(list.value['n_1'])
      assert.strictEqual(parsed.i, 0)
    })

    await t.test('note 2 has an index at 1', () => {
      const parsed = JSON.parse(list.value['n_1'])
      assert.strictEqual(parsed.i, 0)
    })

    await t.test('each value has a json of the array item', () => {
      assert.strictEqual(typeof list.value['n_1'], 'string')
    })

    await t.test('user 1 json matches the note 1 array item', () => {
      const parsed = JSON.parse(list.value['n_1'])

      assert.strictEqual(parsed.json.text, 'foo')
    })
  })
})
