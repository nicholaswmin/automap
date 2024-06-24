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

  await t.test('root', async t => {
    let result, root = null

    beforeEach(() => {
      result = flatten(chatroom)

      root = result.root
    })

    await t.test('result has a root property', async t => {
      assert.ok(Object.hasOwn(result, 'root'))
    })

    await t.test('result.root has a key property', async t => {
      assert.ok(Object.hasOwn(result.root, 'key'))

      await t.test('key property is set in "constructor:id" format', t => {
        assert.strictEqual(result.root.key, 'chatroom:c_1')
      })
    })

    await t.test('result.root has a value property', async t => {
      assert.ok(Object.hasOwn(result.root, 'value'))

      await t.test('value property is a json', async t => {
        assert.strictEqual(typeof result.root.value, 'string')
      })

      await t.test('json', async t => {
        let parsed = null

        await beforeEach(() => {
          parsed = JSON.parse(result.root.value)
        })

        await t.test('json has same keys as root', async t => {
          const keys = Object.keys(parsed)
          assert.deepStrictEqual(keys, ['id', 'messages', 'users'])
        })

        await t.test('AppendList is replaced with a path', async t => {
          assert.ok(parsed.messages.includes('chatroom:c_1:messages'))
        })

        await t.test('List is replaced with a path', async t => {
          assert.ok(parsed.users.includes('chatroom:c_1:users'))
        })

        await t.test('the path can be split into actual path and traits', t => {
          assert.strictEqual(parsed.users.split(' ').length, 2)
        })

        await t.test('traits part is parseable & includes trait type', t => {
          const traitsJSON = parsed.users.split(' ')[1]

          assert.deepStrictEqual(JSON.parse(traitsJSON), { type: 'hash' })
        })
      })
    })
  })
})
