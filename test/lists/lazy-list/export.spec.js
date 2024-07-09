import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { LazyList } from '../../../src/list.js'
import { User } from '../../model/index.js'

test('LazyList', async t => {
  let list

  await t.test('#exportForSave', async t => {
    let result = null

    await t.test('list has no items', async t => {
      await t.beforeEach(t => {
        list = new LazyList({ from: [], type: Message })

        result = list.exportForSave('sample:path')
      })
    })

    await t.test('list has items', async t => {
      await t.beforeEach(t => {
        list = new LazyList({
          from: [{ id: 'u_1', name: 'John' }, { id: 'u_2', name: 'Mary' }]
        })

        result = list.exportForSave('sample:path')
      })

      await t.test('returns an object', t => {
        assert.ok(result)
        assert.strictEqual(typeof result, 'object')
      })

      await t.test('with a type property', async t => {
        assert.ok(Object.hasOwn(result, 'type'))

        await t.test('set to "hash"', t => {
          assert.strictEqual(result.type, 'hash')
        })
      })

      await t.test('with a value property', async t => {
        assert.ok(Object.hasOwn(result, 'value'))

        await t.test('set to an object', t => {
          assert.strictEqual(typeof result.value, 'object')
        })

        await t.test('with 2 keys', t => {
          assert.strictEqual(Object.keys(result.value).length, 2)
        })

        await t.test('matching the ids of the initial elements', t => {
          assert.strictEqual(Object.hasOwn(result.value, 'u_1'), true)
          assert.strictEqual(Object.hasOwn(result.value, 'u_2'), true)
        })

        await t.test('with values as JSON strings', t => {
          assert.strictEqual(Object.hasOwn(result.value, 'u_1'), true)
          assert.strictEqual(Object.hasOwn(result.value, 'u_2'), true)
        })

        await t.test('parsing the value JSONs', async t => {
          let parsed = []

          await before(() => {
            parsed.push(
              JSON.parse(result.value.u_1),
              JSON.parse(result.value.u_2)
            )
          })

          await t.test('parsed results have an index', t => {
            parsed.forEach(parsed => {
              assert.ok(Object.hasOwn(parsed, 'i'))
            })
          })

          await t.test('index maps to the initial elements indices', t => {
            assert.strictEqual(parsed[0].i, 0)
            assert.strictEqual(parsed[1].i, 1)
          })

          await t.test('parsed results have a json property', t => {
            parsed.forEach(parsed => {
              assert.ok(Object.hasOwn(parsed, 'json'))
            })
          })

          await t.test('result.json maps to the initial elements', t => {
            assert.deepStrictEqual(parsed[0].json, list[0])
            assert.deepStrictEqual(parsed[1].json, list[1])
          })
        })
      })
    })
  })
})
