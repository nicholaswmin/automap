import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { flatten } from '../../../src/map.js'
import { Chatroom } from '../../model/index.js'

test('#flatten()', async t => {
  let chatroom

  await t.beforeEach(t => {
    chatroom = new Chatroom({
      id: 'c_1',
      messages: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
      users: [
        { id: 'u_1', name: 'John', notes: ['foo', 'bar'] },
        { id: 'u_2', name: 'Mary', notes: ['baz'] }
      ]
    })
  })

  await t.test('list properties (except value)', async t => {
    let result = null

    beforeEach(() => {
      result = flatten(chatroom)
    })

    await t.test('returns a result', async t => {
      assert.ok(result)

      await t.test('has a list property', t => {
        assert.ok(Object.hasOwn(result, 'lists'))
      })

      await t.test('which is an Array', t => {
        assert.ok(Array.isArray(result.lists))
      })

      await t.test('containing an entry for each List in the root', async t => {
        assert.strictEqual(result.lists.length, 3)
      })
    })
  })
})
