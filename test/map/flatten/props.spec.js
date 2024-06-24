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
        assert.ok(Object.hasOwn(result, 'list'))
      })

      await t.test('which is an Array', t => {
        assert.ok(Array.isArray(result.list))
      })

      await t.test('containing an entry for each List in the root', async t => {
        assert.strictEqual(result.list.length, 4)

        await t.test('each entry has a storepath property', t => {
          for (const entry of result.list)
            assert.ok(Object.hasOwn(entry, 'storepath'))
        })

        await t.test('describing the position of the list in the root', t => {
          const storepaths = result.list.map(item => item.storepath)

          assert.ok(storepaths.includes('chatroom:c_1:messages'))
          assert.ok(storepaths.includes('chatroom:c_1:users:u_1:notes'))
          assert.ok(storepaths.includes('chatroom:c_1:users:u_2:notes'))
          assert.ok(storepaths.includes('chatroom:c_1:users'))
        })
      })
    })
  })
})
