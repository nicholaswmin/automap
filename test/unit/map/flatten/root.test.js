import test from 'node:test'

import { flatten } from '../../../../src/map.js'
import { Building } from '../../../util/model/index.js'

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

    building.flats.at(0).addMail({ id: 'm1', text: 'bonjour' })
  })

  await t.test('root', async t => {
    let result

    t.beforeEach(() => {
      result = flatten(building)
    })

    await t.test('result has a root property', t => {
      t.assert.ok(Object.hasOwn(result, 'root'))
    })

    await t.test('result.root has a key property', async t => {
      t.assert.ok(Object.hasOwn(result.root, 'key'))

      await t.test('key property is set in "constructor:id" format', t => {
        t.assert.strictEqual(result.root.key, 'building:foo')
      })
    })

    await t.test('result.root has a value property', async t => {
      t.assert.ok(Object.hasOwn(result.root, 'value'))

      await t.test('value property is a json', t => {
        t.assert.strictEqual(typeof result.root.value, 'string')
      })

      await t.test('json', async t => {
        let parsed = null

        t.beforeEach(() => {
          parsed = JSON.parse(result.root.value)
        })

        await t.test('json has same keys as root', t => {
          const keys = Object.keys(parsed)
          t.assert.ok(
            ['visitors', 'mail', 'flats', 'id']
              .every(prop => keys.includes(prop)),
            `keys are actually: ${keys}`
          )
        })

        await t.test('AppendList is replaced with a path', t => {
          t.assert.ok(parsed.mail.includes('building:foo:mail'))
        })

        await t.test('List is replaced with a path', t => {
          t.assert.ok(parsed.flats.includes('building:foo:flats'))
        })

        await t.test('the path can be split to actual path and traits', t => {
          t.assert.strictEqual(parsed.visitors.split(' ').length, 2)
        })

        await t.test('traits part is parseable & includes trait type', t => {
          const traitsJSON = parsed.visitors.split(' ')[1]

          t.assert.deepStrictEqual(
            JSON.parse(traitsJSON),
            { lazy: true, type: 'hash' }
          )
        })
      })
    })
  })
})
