import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building, Person } from '../../../util/model/index.js'

test('#repository.save()', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('fetching existing object with 1 LazyList item', async t => {
    let building = null

    t.beforeEach(async () => {
      await repo.save(new Building({
        id: 'foo', visitors: [{ id: 1 }]
      }))

      building = await repo.fetch('foo')
    })

    await t.test('does not preload the list', () => {
      assert.strictEqual(building.visitors.length, 0)
    })

    await t.test('loading its list once', async t => {
      t.beforeEach(() => building.visitors.load(repo))

      await t.test('loads the item', () => {
        assert.strictEqual(building.visitors.length, 1)
      })

      await t.test('with the correct type', () => {
        assert.ok(building.visitors.at(0) instanceof Person, 'not a Building')
      })

      await t.test('loading its list again', async t => {
        t.beforeEach(() => {
           building.visitors.load(repo)
        })

        await t.test('still loads one item', () => {
          assert.strictEqual(building.visitors.length, 1)
        })
      })
    })
  })
})
