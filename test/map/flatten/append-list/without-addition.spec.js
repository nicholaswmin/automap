import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { flatten } from '../../../../src/map.js'
import { Chatroom } from '../../../model/index.js'

test('#flatten()', async t => {
  let list

  await t.beforeEach(t => {
    let chatroom = new Chatroom({
      id: 'c_1',
      messages: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
      users: [
        { id: 'u_1', name: 'John', notes: ['foo', 'bar'] },
        { id: 'u_2', name: 'Mary', notes: ['baz'] }
      ]
    })

    let result = flatten(chatroom)

    list = result.list.find(r => r.storepath === 'chatroom:c_1:messages')
  })

  await t.test('value has key matching the path of the list', t => {
    assert.strictEqual(list.value.key, 'chatroom:c_1:messages')
  })

  await t.test('value has type set to "list"', t => {
    assert.strictEqual(list.value.type, 'list')
  })

  await t.test('value of value is an Array', t => {
    assert.ok(Array.isArray(list.value.value))
  })

  await t.test('when there is no new addition', async t => {
    await t.test('array is empty', t => {
      assert.strictEqual(list.value.value.length, 0)
    })
  })
})
