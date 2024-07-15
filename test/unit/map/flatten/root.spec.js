import assert from 'node:assert'
import { test } from 'node:test'

import { flatten } from '../../../../src/map.js'
import { Building } from '../../../util/model/index.js'

test('#flatten()', async t => {
  let building

  t.beforeEach(() => {
    building = new Building({
      id: 'foo',
      mail: [ { id: 'm1', text: 'hi' } ],
      offices: [
        { id: 'o1', department: 'I.T' },
        { id: 'm1', department: 'accounting' }
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

    await t.test('result has a root property', () => {
      assert.ok(Object.hasOwn(result, 'root'))
    })

    await t.test('result.root has a key property', async t => {
      assert.ok(Object.hasOwn(result.root, 'key'))

      await t.test('key property is set in "constructor:id" format', () => {
        assert.strictEqual(result.root.key, 'building:foo')
      })
    })

    await t.test('result.root has a value property', async t => {
      assert.ok(Object.hasOwn(result.root, 'value'))

      await t.test('value property is a json', () => {
        assert.strictEqual(typeof result.root.value, 'string')
      })

      await t.test('json', async t => {
        let parsed = null

        t.beforeEach(() => {
          parsed = JSON.parse(result.root.value)
        })

        await t.test('json has same keys as root', () => {
          const keys = Object.keys(parsed)
          assert.ok(
            ['offices', 'mail', 'flats', 'id']
              .every(prop => keys.includes(prop)),
            `keys are actually: ${keys}`
          )
        })

        await t.test('AppendList is replaced with a path', () => {
          assert.ok(parsed.mail.includes('building:foo:mail'))
        })

        await t.test('List is replaced with a path', () => {
          assert.ok(parsed.flats.includes('building:foo:flats'))
        })

        await t.test('the path can be split to actual path and traits', () => {
          assert.strictEqual(parsed.offices.split(' ').length, 2)
        })

        await t.test('traits part is parseable & includes trait type', () => {
          const traitsJSON = parsed.offices.split(' ')[1]

          assert.deepStrictEqual(
            JSON.parse(traitsJSON),
            { lazy: true, type: 'hash' }
          )
        })
      })
    })
  })
})
