import assert from 'node:assert'
import { test } from 'node:test'

import { LazyList } from '../../../../src/list.js'
import { Message } from '../../../util/model/index.js'

test('LazyList', async t => {
  let list

  await t.test('instantiation', async t => {
    await t.test('without passing a "type"', async t => {
      await t.beforeEach(() => {
        list = new LazyList({
          from: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }]
        })
      })

      await t.test('adds the items', () => {
        assert.strictEqual(list.length, 2)
      })

      await t.test('adds the items as-is', () => {
        assert.strictEqual(list[0].text, 'Hello')
        assert.strictEqual(list[1].text, 'World')
      })
    })

    await t.test('passing a "type"', async t => {
      await t.beforeEach(() => {
        list = new LazyList({
          from: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
          type: Message
        })
      })

      await t.test('adds the items', () => {
        assert.strictEqual(list.length, 2)
      })

      await t.test('maps the items as instances', () => {
        assert.strictEqual(list[0].constructor.name, 'Message')
        assert.strictEqual(list[1].constructor.name, 'Message')
      })
    })

    await t.todo('without passing an items array', async () => {
      // Cannot easily test since without `items` in the initial object
      // means it wont follow the flow that wires up the instance.
      await t.test('throws', () => {
        assert.throws(
          () => {
            list = new LazyList({ type: Message })
          })
      })
    })

    await t.test('has correct traits', async t => {
      await t.test('has a traits property', () => {
        assert.ok(Object.hasOwn(list.constructor, 'traits'))
      })

      await t.test('has a traits.type property', () => {
        assert.ok(Object.hasOwn(list.constructor.traits, 'type'))
      })

      await t.test('with 3 keys', () => {
        assert.strictEqual(Object.keys(list.constructor.traits).length, 2)
      })

      await t.test('traits.type property is set to "hash"', () => {
        assert.strictEqual(list.constructor.traits.type, 'hash')
      })
    })
  })

  await t.test('has correct loaded state', async t => {
    await t.test('has a loaded property', () => {
      assert.ok(Object.hasOwn(list, 'loaded'))
    })

    await t.test('set to false', () => {
      assert.strictEqual(list.loaded, false)
    })
  })

  await t.test('passing an empty items array', async t => {
    await t.beforeEach(() => {
      list = new LazyList({ from: [], type: Message })
    })

    await t.test('has no items', () => {
      assert.strictEqual(list.length, 0)
    })

    await t.test('is not loaded', () => {
      assert.ok(list.loaded === false)
    })
  })
})
