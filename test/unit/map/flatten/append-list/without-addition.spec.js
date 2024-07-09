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

    let result = flatten(chatroom)
    list = result.lists.find(r => r.key === 'chatroom:c_1:messages')
  })

  await t.test('does not export list since it has no additions', () => {
    assert.strictEqual(list, undefined)
  })
})
