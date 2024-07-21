import test from 'node:test'

import { Building } from '../../util/model/index.js'

test('Lists behave like Arrays', async t => {
  let building

  t.beforeEach(() => {
    building = new Building({
      id: 'foo',
      flats: [
        { id: '101', bedrooms: 1 },
        { id: '102', bedrooms: 2 }
      ]
    })

    building.flats.at(0).addMail({ id: 'm1', text: 'foo' })
    building.flats.at(1).addMail({ id: 'm2', text: 'bar' })
    building.flats.at(1).addMail({ id: 'm3', text: 'baz' })
  })

  await t.test('lists behave like normal arrays', async t => {
    await t.test('identify as arrays', async t => {
      await t.test('Lists', t => {
        t.assert.ok(Array.isArray(building.flats))
      })

      await t.test('Append Lists', t => {
        t.assert.ok(Array.isArray(building.flats.at(0).mail))
      })
    })

    await t.test('can be iterated over with a for loop', async t => {
      await t.test('Lists', t => {
        let j = 1
        for (let i = 1; i < building.flats.at(0).mail.length + 1; i++)
          ++j

        t.assert.strictEqual(j > 0, true)
      })

      await t.test('AppendList', t => {
        let j = 1
        for (let i = 1; i < building.flats.at(0).mail.length + 1; i++)
          ++j

        t.assert.strictEqual(j > 1, true)
      })
    })
  })
})
