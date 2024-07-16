import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building, Flat } from '../../../util/model/index.js'

test('#repository.save()', async t => {
  const repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' }))

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('fetching existing object with 2 List items', async t => {
    let building = null

    t.beforeEach(async () => {
      await repo.save(new Building({
        id: 'foo', flats: [{ id: 1 }, { id: 2 }]
      }))

      building = await repo.fetch('foo')
    })

    await t.test('fetches the object', () => {
      assert.ok(building)
    })

    await t.test('loads the list items', () => {
      assert.strictEqual(building.flats.length, 2)
    })

    await t.test('with the correct type', () => {
      assert.ok(building.flats.at(0) instanceof Flat, 'not a Flat')
    })
  })
})
