import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { flatten } from '../../../../src/map.js'
import { Chatroom } from '../../../model/index.js'

test('#flatten()', async t => {
  let chatroom

  await t.beforeEach(t => {
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

    beforeEach(() => {
      const result = flatten(chatroom)

      list = result.list
        .find(item => item.storepath === 'chatroom:c_1:users:u_1:notes')
    })

    await t.test('value has key matching the path of the list', t => {
      assert.strictEqual(list.value.key, 'chatroom:c_1:users:u_1:notes')
    })

    await t.test('value has type set to "hash"', t => {
      assert.strictEqual(list.value.type, 'hash')
    })

    await t.test('value of value is an Object', t => {
      assert.ok(typeof list.value.value === 'object')
    })

    await t.test('k/v pairs in object match the referenced array items', t => {
      assert.strictEqual(Object.keys(list.value.value).length, 1)
    })

    await t.test('each key in value maps to an id of an array item', t => {
      assert.deepStrictEqual(Object.keys(list.value.value), ['n_1'])
    })

    await t.test('note 1 has an index at 0', t => {
      const parsed = JSON.parse(list.value.value['n_1'])
      assert.strictEqual(parsed.i, 0)
    })

    await t.test('note 2 has an index at 1', t => {
      const parsed = JSON.parse(list.value.value['n_1'])
      assert.strictEqual(parsed.i, 0)
    })

    await t.test('each value has a json of the array item', t => {
      assert.strictEqual(typeof list.value.value['n_1'], 'string')
    })

    await t.test('user 1 json matches the note 1 array item', t => {
      const parsed = JSON.parse(list.value.value['n_1'])

      assert.strictEqual(parsed.json.text, 'foo')
    })
  })
})
