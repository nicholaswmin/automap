import test from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'

test('#repository.save()', async t => {
  const repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' }))

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('existing object with 1 list item', async t => {
    let building = null

    t.beforeEach(async () => {
      building = new Building({
        id: 'foo', flats: [{ id: 1 }]
      })

      building.flats.at(0).addMail()

      await repo.save(building)

      building = await repo.fetch('foo')
    })

    await t.test('adding another AppendList item and saving', async t => {
      t.beforeEach(async () => {
        building.flats.at(0).addMail()

        await repo.save(building)
      })

      await t.test('saves in a Redis List:', async t => {
        let items = null

        t.beforeEach(async () => {
          items = await repo.redis
            .lrange('building:foo:flats:1:mail', 0, -1)
        })

        await t.test('under a human readable path', t => {
          t.assert.ok(items, 'no such Redis key: building:foo:flats:1:mail')
        })

        await t.test('both items', t => {
          t.assert.strictEqual(Object.keys(items).length, 2)
        })
      })

      await t.test('fetching the object', async t => {
        t.beforeEach(async () => {
          building = await repo.fetch('foo')
        })

        await t.test('fetches the object', t => {
          t.assert.ok(building)
        })

        await t.test('with no preloaded items', t => {
          t.assert.strictEqual(building.flats.at(0).mail.length, 0)
        })

        await t.test('loading the list:', async t => {
          t.beforeEach(async () => {
            await building.flats.load(repo)
            await building.flats.at(0).mail.load(repo)
          })

          await t.test('loads both the items', t => {
            t.assert.strictEqual(building.flats.at(0).mail.length, 2)
          })
        })
      })
    })
  })
})
