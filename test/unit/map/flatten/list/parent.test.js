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
        { id: '101', bedrooms: 1 },
        { id: '102', bedrooms: 2 }
      ]
    })
  })

  await t.test('List parent of another nested List - value', async t => {
    let result, list = null

    t.beforeEach(() => {
      result = flatten(building)

      list = result.lists.find(item => item.key === 'building:foo:flats')
    })

    await t.test('value is an object', t => {
      t.assert.strictEqual(typeof list.value, 'object')
    })

    await t.test('with same number of keys as array items', t => {
      t.assert.strictEqual(Object.keys(list.value).length, 2)
    })

    await t.test('with keys matching the ids of the array items', t => {
      t.assert.deepStrictEqual(Object.keys(list.value), ['101', '102'])
    })

    await t.test('with items as json strings', t => {
      t.assert.ok(typeof list.value['101'].json, 'string')
      t.assert.ok(typeof list.value['102'].json, 'string')
    })

    await t.test('items have a json property', async t => {
      let parsed = null

      t.beforeEach(() => {
        parsed = JSON.parse(list.value['101'])
      })

      await t.test('with an index property', t => {
        t.assert.ok(Object.hasOwn(parsed, 'i'))
        t.assert.strictEqual(parsed.i, 0)
      })

      await t.test('and have the same keys as the array item', t => {
        t.assert.deepStrictEqual(
          Object.keys(parsed.json),
          [ 'id','bedrooms','mail', 'visitors' ]
        )
      })

      await t.test('the List properties are replaced with a path', async t => {
        const mail = parsed.json.mail
        t.assert.ok(mail.includes('building:foo:flats:101:mail'))

        await t.test('the path can be split to actual path and traits', t => {
          const mail = parsed.json.mail
          t.assert.strictEqual(mail.split(' ').length, 2)
        })

        await t.test('traits part is parseable & includes trait type', t => {
          const traitsJSON = parsed.json.mail.split(' ')[1]

          t.assert.deepStrictEqual(JSON.parse(traitsJSON), {
            append: true,
            lazy: true,
            type: 'list'
          })
        })
      })
    })
  })
})
