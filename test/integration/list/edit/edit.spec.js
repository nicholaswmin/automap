import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Chatroom } from '../../../helpers/model/index.js'
import { deleteall } from '../../../helpers/utils/index.js'

test('#repository.save()', async t => {
  let redis = new ioredis()

  await t.beforeEach(() => deleteall(redis, 'chatroom'))
  await t.afterEach(() => deleteall(redis, 'chatroom'))
  await t.after(() => redis.disconnect())

  await t.test('existing object with 10 list item', async t => {
    let repo = new Repository(Chatroom, redis), room = null

    await t.beforeEach(async () => {
      await repo.save(new Chatroom({
        id: 'foo',
        users: Array.from({ length: 10 }, (_, i) => ({
          id: i, name: 'John-' + i
        }))
      }))
    })

    await t.test('edit 5 list item', async t => {
      await t.beforeEach(async () => {
        room = await repo.fetch('foo')

        for (let i = 5; i < 10; i++)
          room.users.at(i).name = 'Jane-' + i

        await repo.save(room)
      })

      await t.test('fetching back the object', async t => {
        await t.beforeEach(async () => {
          room = await repo.fetch('foo')
        })

        await t.test('has the same number of items', () => {
          assert.strictEqual(room.users.length, 10)
        })

        await t.test('edited items are edited', () => {
          for (let i = 5; i < 10; i++)
            assert.strictEqual(room.users.at(i).name, 'Jane-' + i)
        })

        await t.test('non-edited items are not edited', () => {
          for (let i = 0; i < 5; i++)
            assert.strictEqual(room.users.at(i).name, 'John-' + i)
        })
      })
    })
  })
})
