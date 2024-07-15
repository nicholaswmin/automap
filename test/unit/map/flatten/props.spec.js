import assert from 'node:assert'
import { test } from 'node:test'

import { flatten } from '../../../../src/map.js'
import { Building } from '../../../util/model/index.js'

test('#flatten()', async t => {
  let building

  t.beforeEach(() => {
    building = new Building({
      id: 'foo',
      guests: [
        { id: 'm1', text: 'hi' },
        { id: 'm2', text: 'hola' }
      ],
      flats: [
        { id: 'm1', text: 'hi' },
        { id: 'm2', text: 'hola' }
      ],
      visitors: [
        { id: '101', bedrooms: 1 },
        { id: '102', bedrooms: 2 }
      ]
    })
  })

  await t.test('list properties (except value)', async t => {
    let result = null

    t.beforeEach(() => {
      result = flatten(building)
    })

    await t.test('returns a result', async t => {
      assert.ok(result)

      await t.test('has a list property', () => {
        assert.ok(Object.hasOwn(result, 'lists'))
      })

      await t.test('which is an Array', () => {
        assert.ok(Array.isArray(result.lists))
      })

      await t.test('containing an entry for each List in the root', () => {
        assert.strictEqual(result.lists.length, 2)
      })
    })
  })
})
