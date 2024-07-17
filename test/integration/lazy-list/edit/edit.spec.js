import test from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'

test('#repository.save()', async t => {
  const repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' }))

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

    await t.test('loading its list', async t => {
      t.beforeEach(() => building.visitors.load(repo))

      await t.test('editing its LazyList item and saving', async t => {
        t.beforeEach(async () => {
          building.visitors.at(0).name = 'Jane'

          repo.save(building)
        })

        await t.test('fetching the object again', async t => {
          t.beforeEach(async () =>
            building = await repo.fetch('foo'))

          await t.test('and loading its list', async t => {
            t.beforeEach(() => building.visitors.load(repo))

            await t.test('loads the item', t => {
              t.assert.strictEqual(building.visitors.length, 1)
            })

            await t.test('which is edited', t => {
              t.assert.strictEqual(building.visitors.at(0).name, 'Jane')
            })
          })
        })
      })
    })
  })
})
