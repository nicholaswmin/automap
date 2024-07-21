import test from 'node:test'

import { flatten } from '../../../../../src/map.js'
import { Building } from '../../../../util/model/index.js'

test('#flatten()', async t => {
  let building

  t.beforeEach(() => {
    building = new Building({
      id: 'foo',
      mail: [ { id: 'm1', text: 'hi' } ],
      visitors: [
        { id: 'j1', name: 'John' },
        { id: 'j2', name: 'Jane' }
      ],
      flats: [
        {
          id: '101', bedrooms: 1,
          visitors: [
            { id: 'p1', name: 'John' },
            { id: 'p2', name: 'Jane' }
          ]
        },
        {
          id: '102', bedrooms: 2
        }
      ]
    })
  })

  await t.test('Nested List - value', async t => {
    let list = null

    t.beforeEach(() => {
      const result = flatten(building)

      list = result.lists
        .find(item => item.key === 'building:foo:flats:101:visitors')
    })

    await t.test('value has key matching the path of the list', t => {
      t.assert.strictEqual(list.key, 'building:foo:flats:101:visitors')
    })

    await t.test('value has type set to "hash"', t => {
      t.assert.strictEqual(list.type, 'hash')
    })

    await t.test('value of value is an Object', t => {
      t.assert.ok(typeof list.value === 'object')
    })

    await t.test('k/v pairs in object match the referenced array items', t => {
      t.assert.strictEqual(Object.keys(list.value).length, 2)
    })

    await t.test('each key in value maps to an id of an array item', t => {
      t.assert.deepStrictEqual(Object.keys(list.value), ['p1', 'p2'])
    })

    await t.test('visitor 1 has an index at 0', t => {
      const parsed = JSON.parse(list.value['p1'])
      t.assert.strictEqual(parsed.i, 0)
    })

    await t.test('visitor 2 has an index at 1', t => {
      const parsed = JSON.parse(list.value['p1'])
      t.assert.strictEqual(parsed.i, 0)
    })

    await t.test('each value has a json of the array item', t => {
      t.assert.strictEqual(typeof list.value['p1'], 'string')
    })

    await t.test('visitor 1 json matches the visitor 1 array item', t => {
      const parsed = JSON.parse(list.value['p1'])

      t.assert.strictEqual(parsed.json.name, 'John')
    })
  })
})
