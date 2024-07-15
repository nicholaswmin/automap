import assert from 'node:assert'
import { test } from 'node:test'

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

  await t.test('does not export list since it has no additions', () => {
    assert.strictEqual(list, undefined)
  })
})
