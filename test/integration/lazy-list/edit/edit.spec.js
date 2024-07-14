import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../helpers/model/index.js'

test('#repository.save()', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('fetching existing object with 1 LazyList item', async t => {
    let building = null

    t.beforeEach(async () => {
      await repo.save(new Building({
        id: 'foo', offices: [{ id: 1 }]
      }))

      building = await repo.fetch('foo')
    })

    await t.test('loading its list', async t => {
      t.beforeEach(() => building.offices.load(repo))

      await t.test('editing its LazyList item and saving', async t => {
        t.beforeEach(async () => {
          building.offices.at(0).department = 'I.T'

          repo.save(building)
        })

        await t.test('fetching the object again', async t => {
          t.beforeEach(async () =>
            building = await repo.fetch('foo'))

          await t.test('and loading its list', async t => {
            t.beforeEach(() => building.offices.load(repo))

            await t.test('loads the item', async t => {
              assert.strictEqual(building.offices.length, 1)
            })

            await t.test('which is edited', async t => {
              assert.strictEqual(building.offices.at(0).department, 'I.T')
            })
          })
        })
      })
    })
  })
})
