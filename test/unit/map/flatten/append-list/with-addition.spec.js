import test from 'node:test'

import { flatten } from '../../../../../src/map.js'
import { Building } from '../../../../util/model/index.js'

test('#flatten()', async t => {
  let list

  t.beforeEach(() => {
    let building = new Building({
      id: 'foo',
      visitors: [
        { id: 'j1', name: 'John' },
        { id: 'j2', name: 'Jane' }
      ],
      flats: [
        { id: '101', bedrooms: 1 },
        { id: '102', bedrooms: 2 }
      ]
    })

    building.flats.at(0).addMail({ id: 'm1', text: 'bonjour' })

    let result = flatten(building)

    list = result.lists.find(r => r.key === 'building:foo:flats:101:mail')
  })

  await t.test('value has key matching the path of the list', t => {
    t.assert.strictEqual(list.key, 'building:foo:flats:101:mail')
  })

  await t.test('value has type set to "list"', t => {
    t.assert.strictEqual(list.type, 'list')
  })

  await t.test('value of value is an Array', t => {
    t.assert.ok(Array.isArray(list.value))
  })

  await t.test('when there is a new addition', async t => {
    await t.test('array has 1 item', t => {
      t.assert.strictEqual(list.value.length, 1)
    })

    await t.test('item matches the addition', t => {
      const parsed = JSON.parse(list.value)

      t.assert.deepStrictEqual(parsed, { id: 'm1', text: 'bonjour' })
    })
  })
})
