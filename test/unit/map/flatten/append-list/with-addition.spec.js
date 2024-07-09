import assert from 'node:assert'
import { test } from 'node:test'

import { flatten } from '../../../../../src/map.js'
import { Chatroom } from '../../../../model/index.js'

test('#flatten()', async t => {
  let list

  await t.beforeEach(() => {
    let chatroom = new Chatroom({
      id: 'c_1',
      messages: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
      users: [
        { id: 'u_1', name: 'John', notes: ['foo', 'bar'] },
        { id: 'u_2', name: 'Mary', notes: ['baz'] }
      ]
    })

    chatroom.messages.push({ id: 'm_3', text: 'Hi' })

    let result = flatten(chatroom)

    list = result.lists.find(r => r.key === 'chatroom:c_1:messages')
  })

  await t.test('value has key matching the path of the list', () => {
    assert.strictEqual(list.key, 'chatroom:c_1:messages')
  })

  await t.test('value has type set to "list"', () => {
    assert.strictEqual(list.type, 'list')
  })

  await t.test('value of value is an Array', () => {
    assert.ok(Array.isArray(list.value))
  })

  await t.test('when there is a new addition', async t => {
    await t.test('array has 1 item', () => {
      assert.strictEqual(list.value.length, 1)
    })

    await t.test('item matches the addition', () => {
      const parsed = JSON.parse(list.value)

      assert.deepStrictEqual(parsed, { id: 'm_3', text: 'Hi' })
    })
  })
})
