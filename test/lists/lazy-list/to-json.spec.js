import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { LazyList } from '../../../src/list.js'
import { Message } from '../../model/index.js'

test('LazyList', async t => {
  let list

  await t.test('#exportForSave', async t => {
    let json = null

    await t.beforeEach(t => {
      list = new LazyList({
        items: [{ id: 'm_1', text: 'Hello' }, { id: 'm_2', text: 'World' }],
        construct: item => new Message(item)
      })

      json = list.exportForSave('sample:path')
    })

    await t.test('returns an object', t => {
      assert.ok(json)
      assert.strictEqual(typeof json, 'object')
    })

    await t.test('with a key property', async t => {
      assert.ok(Object.hasOwn(json, 'key'))

      await t.test('set to the passed path', t => {
        assert.strictEqual(json.key, 'sample:path')
      })
    })

    await t.test('with a type property', async t => {
      assert.ok(Object.hasOwn(json, 'type'))

      await t.test('set to "hash"', t => {
        assert.strictEqual(json.type, 'hash')
      })
    })

    await t.test('with a value property', async t => {
      assert.ok(Object.hasOwn(json, 'value'))

      await t.test('set to an object', t => {
        assert.strictEqual(typeof json.value, 'object')
      })

      await t.test('with 2 keys', t => {
        assert.strictEqual(Object.keys(json.value).length, 2)
      })

      await t.test('matching the ids of the initial elements', t => {
        assert.strictEqual(Object.hasOwn(json.value, 'm_1'), true)
        assert.strictEqual(Object.hasOwn(json.value, 'm_2'), true)
      })

      await t.test('with values as jsons of the initial elements', async t => {
        assert.strictEqual(typeof json.value.m_1, 'string')
        assert.strictEqual(typeof json.value.m_2, 'string')

        await t.test('values are parseable jsons', t => {
          assert.doesNotThrow(() => JSON.parse(json.value.m_1))
          assert.doesNotThrow(() => JSON.parse(json.value.m_2))
        })

        await t.test('parsed jsons have an index', t => {
          assert.ok(Object.hasOwn(JSON.parse(json.value.m_1), 'i'))
          assert.ok(Object.hasOwn(JSON.parse(json.value.m_2), 'i'))
        })

        await t.test('index maps to the initial elements indices', t => {
          assert.strictEqual(JSON.parse(json.value.m_1).i, 0)
          assert.strictEqual(JSON.parse(json.value.m_2).i, 1)
        })

        await t.test('parsed jsons have a json property', t => {
          assert.ok(JSON.parse(json.value.m_1).json)
          assert.ok(JSON.parse(json.value.m_2).json)
        })

        await t.test('parsed jsons map to the initial elements', t => {
          assert.deepStrictEqual(
            JSON.parse(json.value.m_1).json,
            JSON.parse(JSON.stringify(list[0]))
          )
          assert.deepStrictEqual(
            JSON.parse(json.value.m_2).json,
            JSON.parse(JSON.stringify(list[1]))
          )
        })
      })
    })
  })
})
