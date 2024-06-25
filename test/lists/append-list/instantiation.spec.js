import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { AppendList } from '../../../src/list.js'
import { Message } from '../../model/index.js'

test('AppendList', async t => {
  let list

  await t.test('instantiation', async t => {
    await t.test('without passing a construct function', async t => {
      await t.beforeEach(t => {
        list = new AppendList({
          from: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }]
        })
      })

      await t.test('adds the items', t => {
        assert.strictEqual(list.length, 2)
      })

      await t.test('adds the items as-is', t => {
        assert.strictEqual(list[0].text, 'Hello')
        assert.strictEqual(list[1].text, 'World')
      })
    })

    await t.test('passing a construct function', async t => {
      await t.beforeEach(t => {
        list = new AppendList({
          from: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', name: 'World' }],
          type: Message
        })
      })

      await t.test('adds the items', t => {
        assert.strictEqual(list.length, 2)
      })

      await t.test('maps the items as instances', t => {
        assert.strictEqual(list[0].constructor.name, 'Message')
        assert.strictEqual(list[1].constructor.name, 'Message')
      })
    })

    await t.todo('without passing an items array', async t => {
      // Cannot easily test since without `items` in the initial object
      // means it wont follow the flow that wires up the instance.
      await t.test('throws', t => {
        assert.throws(
          () => {
            list = new List({
              type: User
            })
          })
      })
    })

    await t.test('has correct traits', async t => {
      await t.test('has a traits property', t => {
        assert.ok(Object.hasOwn(list.constructor, 'traits'))
      })

      await t.test('has a traits.type property', t => {
        assert.ok(Object.hasOwn(list.constructor.traits, 'type'))
      })

      await t.test('with 3 keys', t => {
        assert.strictEqual(Object.keys(list.constructor.traits).length, 3)
      })

      await t.test('traits.type property is set to "list"', t => {
        assert.strictEqual(list.constructor.traits.type, 'list')
      })
    })
  })

  await t.test('has correct loaded state', async t => {
    await t.test('has a loaded property', t => {
      assert.ok(Object.hasOwn(list, 'loaded'))
    })

    await t.test('set to false', t => {
      assert.strictEqual(list.loaded, false)
    })
  })
})
