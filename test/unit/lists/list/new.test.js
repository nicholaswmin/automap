import test from 'node:test'

import { List } from '../../../../src/list.js'
import { Mail } from '../../../util/model/index.js'

test('List', async t => {
  let list

  await t.test('instantiation', async t => {
    await t.test('without passing a "type"', async t => {
      t.beforeEach(() => {
        list = new List({
          from: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }]
        })
      })

      await t.test('adds the items', t => {
        t.assert.strictEqual(list.length, 2)
      })

      await t.test('adds the items as-is', t => {
        t.assert.strictEqual(list[0].text, 'Hello')
        t.assert.strictEqual(list[1].text, 'World')
      })
    })

    await t.test('passing a "type"', async t => {
      t.beforeEach(() => {
        list = new List({
          from: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
          type: Mail
        })
      })

      await t.test('adds the items', t => {
        t.assert.strictEqual(list.length, 2)
      })

      await t.test('maps the items as instances', t => {
        t.assert.strictEqual(list[0].constructor.name, 'Mail')
        t.assert.strictEqual(list[1].constructor.name, 'Mail')
      })
    })

    t.todo('without passing an items array', async t => {
      // Cannot easily test since without `items` in the initial object
      // means it wont follow the flow that wires up the instance.
      await t.test('throws', t => {
        t.assert.throws(
          () => {
            list = new List({ type: Mail })
          })
      })
    })

    await t.test('has correct traits', async t => {
      await t.test('has a traits property', t => {
        t.assert.ok(Object.hasOwn(list.constructor, 'traits'))
      })

      await t.test('has a traits.type property', t => {
        t.assert.ok(Object.hasOwn(list.constructor.traits, 'type'))
      })

      await t.test('with only 1 key', t => {
        t.assert.strictEqual(Object.keys(list.constructor.traits).length, 1)
      })

      await t.test('traits.type property is set to "hash"', t => {
        t.assert.strictEqual(list.constructor.traits.type, 'hash')
      })
    })
  })

  await t.test('has correct loaded state', async t => {
    await t.test('has a loaded property', t => {
      t.assert.ok(Object.hasOwn(list, 'loaded'))
    })

    await t.test('set to true', t => {
      t.assert.ok(list.loaded)
    })
  })

  await t.test('passing an empty items array', async t => {
    t.beforeEach(() => {
      list = new List({ from: [], type: Mail })
    })

    await t.test('has no items', t => {
      t.assert.strictEqual(list.length, 0)
    })

    await t.test('is loaded', t => {
      t.assert.ok(list.loaded)
    })
  })
})
