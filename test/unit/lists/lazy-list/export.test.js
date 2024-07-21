import test from 'node:test'

import { LazyList } from '../../../../src/list.js'
import { Mail } from '../../../util/model/index.js'

test('LazyList', async t => {
  let list

  await t.test('#exportForSave', async t => {
    let result = null

    await t.test('list has no items', async t => {
      t.beforeEach(() => {
        list = new LazyList({ from: [], type: Mail })

        result = list.exportForSave('sample:path')
      })
    })

    await t.test('list has items', async t => {
      t.beforeEach(() => {
        list = new LazyList({
          from: [{ id: 'u_1', name: 'John' }, { id: 'u_2', name: 'Mary' }]
        })

        result = list.exportForSave('sample:path')
      })

      await t.test('returns an object', t => {
        t.assert.ok(result)
        t.assert.strictEqual(typeof result, 'object')
      })

      await t.test('with a type property', async t => {
        t.assert.ok(Object.hasOwn(result, 'type'))

        await t.test('set to "hash"', t => {
          t.assert.strictEqual(result.type, 'hash')
        })
      })

      await t.test('with a value property', async t => {
        t.assert.ok(Object.hasOwn(result, 'value'))

        await t.test('set to an object', t => {
          t.assert.strictEqual(typeof result.value, 'object')
        })

        await t.test('with 2 keys', t => {
          t.assert.strictEqual(Object.keys(result.value).length, 2)
        })

        await t.test('matching the ids of the initial elements', t => {
          t.assert.strictEqual(Object.hasOwn(result.value, 'u_1'), true)
          t.assert.strictEqual(Object.hasOwn(result.value, 'u_2'), true)
        })

        await t.test('with values as JSON strings', t => {
          t.assert.strictEqual(Object.hasOwn(result.value, 'u_1'), true)
          t.assert.strictEqual(Object.hasOwn(result.value, 'u_2'), true)
        })

        await t.test('parsing the value JSONs', async t => {
          let parsed = []

          t.before(() => {
            parsed.push(
              JSON.parse(result.value.u_1),
              JSON.parse(result.value.u_2)
            )
          })

          await t.test('parsed results have an index', t => {
            parsed.forEach(parsed => {
              t.assert.ok(Object.hasOwn(parsed, 'i'))
            })
          })

          await t.test('index maps to the initial elements indices', t => {
            t.assert.strictEqual(parsed[0].i, 0)
            t.assert.strictEqual(parsed[1].i, 1)
          })

          await t.test('parsed results have a json property', t => {
            parsed.forEach(parsed => {
              t.assert.ok(Object.hasOwn(parsed, 'json'))
            })
          })

          await t.test('result.json maps to the initial elements', t => {
            t.assert.deepStrictEqual(parsed[0].json, list[0])
            t.assert.deepStrictEqual(parsed[1].json, list[1])
          })
        })
      })
    })
  })
})
