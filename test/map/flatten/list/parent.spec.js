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

  await t.test('List parent of another nested List - value', async t => {
    let result, list = null

    beforeEach(() => {
      result = flatten(chatroom)

      list = result.lists.find(item => item.key === 'chatroom:c_1:users')
    })

    await t.test('value is an object', t => {
      assert.strictEqual(typeof list.value, 'object')
    })

    await t.test('with same number of keys as array items', t => {
      assert.strictEqual(Object.keys(list.value).length, 2)
    })

    await t.test('with keys matching the ids of the array items', t => {
      assert.deepStrictEqual(Object.keys(list.value), ['u_1', 'u_2'])
    })

    await t.test('with items as json strings', t => {
      assert.ok(typeof list.value.u_1.json, 'string')
      assert.ok(typeof list.value.u_2.json, 'string')
    })

    await t.test('items have a json property', async t => {
      let parsed = null

      await beforeEach(() => {
        parsed = JSON.parse(list.value.u_1)
      })

      await t.test('with an index property', t => {
        assert.ok(Object.hasOwn(parsed, 'i'))
        assert.strictEqual(parsed.i, 0)
      })

      await t.test('and have the same keys as the array item', t => {
        assert.deepStrictEqual(Object.keys(parsed.json), ['id','name','notes'])
      })

      await t.test('the List properties are replaced with a path', async t => {
        const notes = parsed.json.notes
        assert.ok(notes.includes('chatroom:c_1:users:u_1:notes'))

        await t.test('the path can be split into actual path and traits', t => {
          const notes = parsed.json.notes
          assert.strictEqual(notes.split(' ').length, 2)
        })

        await t.test('traits part is parseable & includes trait type', t => {
          const traitsJSON = parsed.json.notes.split(' ')[1]

          assert.deepStrictEqual(JSON.parse(traitsJSON), { type: 'hash' })
        })
      })
    })
  })
})
