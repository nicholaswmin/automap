import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building, Flat } from '../../../util/model/index.js'

test('#repository.save()', async t => {
  const repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' }))

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('new object', async t => {
    let building = null

    t.beforeEach(() => building = new Building({
      id: 'foo', flats: []
    }))

    await t.test('adding a List item and saving', async t => {
      t.beforeEach(async () => {
        building.flats.push(new Flat({ id: 1 }))

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

        await t.test('that one item', () => {
          assert.strictEqual(Object.keys(items).length, 1)
        })
      })

      await t.test('fetching the object again', async t => {
        t.beforeEach(async () =>
          building = await repo.fetch('foo'))

        await t.test('fetches the object', () => {
          assert.ok(building)
        })

        await t.test('which has that one item', () => {
          assert.strictEqual(building.flats.length, 1)
        })
      })
    })
  })
})
