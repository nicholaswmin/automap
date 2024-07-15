import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building, Flat } from '../../../util/model/index.js'

test('#repository.save()', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('fetching existing object with 1 List item', async t => {
    let building = null

    t.beforeEach(async () => {
      await repo.save(new Building({
        id: 'foo', flats: [{ id: 1 }]
      }))

      building = await repo.fetch('foo')
    })

    await t.test('adding a List item and saving', async t => {
      t.beforeEach(async () => {
        building.flats.push(new Flat({ id: 2 }))

        repo.save(building)
      })

      await t.test('saves in a Redis Hash', async t => {
        let items = null

        t.beforeEach(async () => {
          items = await repo.redis.hgetall('building:foo:flats')
        })

        await t.test('under a human readable path', () => {
          assert.ok(items, 'no such Redis key: building:foo:flats')
        })

        await t.test('both items', () => {
          assert.strictEqual(Object.keys(items).length, 2)
        })
      })

      await t.test('fetching the object again', async t => {
        t.beforeEach(async () =>
          building = await repo.fetch('foo'))

        await t.test('and loading its list', async t => {
          t.beforeEach(() => building.flats.load(repo))

          await t.test('which has the previous + new items', () => {
            assert.strictEqual(building.flats.length, 2)
          })
        })
      })
    })
  })
})
