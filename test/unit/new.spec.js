import assert from 'node:assert'
import { test } from 'node:test'

import { Building } from '../util/model/index.js'

test('Model instantiation', async t => {
  let building

  t.beforeEach(() => {
    building = new Building({
      id: 'foo',
      offices: [
        { id: 'o1', department: 'I.T' },
        { id: 'o2', department: 'accounting' }
      ],
      flats: [
        { id: '101', bedrooms: 1 },
        { id: '102', bedrooms: 2 }
      ]
    })

    building.flats.at(0).addMail({ id: 'm1', text: 'foo' })
    building.flats.at(1).addMail({ id: 'm2', text: 'bar' })
    building.flats.at(1).addMail({ id: 'm3', text: 'baz' })
  })

  await t.test('instantiation', async t => {
    await t.test('instantiates ok', () => {
      assert.ok(building)
    })
  })

  await t.test('lists contain the passed items', async t => {
    await t.test('Has 2 items in the flats list', () => {
      assert.strictEqual(building.flats.length, 2)
    })

    await t.test('both are Flat instances', () => {
      building.flats.forEach(flat => {
        assert.strictEqual(flat.constructor.name, 'Flat')
      })
    })

    await t.test('both contain passed properties', () => {
      assert.strictEqual(building.flats[0].id, '101')
      assert.strictEqual(building.flats[0].bedrooms, 1)

      assert.strictEqual(building.flats[1].id, '102')
      assert.strictEqual(building.flats[1].bedrooms, 2)
    })
  })

  await t.test('Nested lists contain the passed items', async t => {
    let flat101Mail
    let flat102Mail

    t.before(() => {
      flat101Mail = building.flats[0].mail
      flat102Mail = building.flats[1].mail
    })

    await t.test('flat.0.mail list', async t => {
      await t.test('has 1 mail', () => {
        assert.strictEqual(flat101Mail.length, 1)
      })
      await t.test('contain the passed text', () => {
        assert.strictEqual(flat101Mail[0].text, 'foo')
      })
    })

    await t.test('flat.1.mail list', async t => {
      await t.test('has 2 mails', () => {
        assert.strictEqual(flat102Mail.length, 2)
      })

      await t.test('contain the passed text', () => {
        assert.strictEqual(flat102Mail[0].text, 'bar')
        assert.strictEqual(flat102Mail[1].text, 'baz')
      })
    })

    await t.test('Has 2 items in the user.1.notes list', () => {
      assert.strictEqual(flat102Mail.length, 2)
    })
  })

  await t.test('append lists track the added items', async t => {
    await t.test('initial list', async t => {
      await t.test('has the initial messages', () => {
        assert.strictEqual(building.flats.at(0).mail.length, 1)
      })

      await t.test('contain the passed text', () => {
        assert.strictEqual(building.flats.at(0).mail.at(0).text, 'foo')
      })

      await t.test('has an additions property', () => {
        assert.ok(Object.hasOwn(building.flats.at(0).mail, 'additions'))
      })

      await t.test('has an addition', () => {
        assert.strictEqual(building.flats.at(0).mail.additions.length, 1)
      })
    })

    await t.test('adding new items', async t => {
      t.beforeEach(() => {
        building.flats.at(0).mail.push(
          { id: '4', text: 'Bonjour' },
          { id: '5', text: 'Amigos' }
        )
      })

      await t.test('adds the items in the list', () => {
        assert.strictEqual(building.flats.at(0).mail.length, 3)
      })

      await t.test('adds the items as additions', () => {
        assert.strictEqual(building.flats.at(0).mail.additions.length, 3)
      })

      await t.test('including their properties', () => {
        assert.strictEqual(building.flats.at(0).mail.additions[0].id, 'm1')
        assert.strictEqual(building.flats.at(0).mail.additions[1].id, '4')
      })
    })
  })
})
