import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Chatroom } from '../../../helpers/model/index.js'
import { deleteall } from '../../../helpers/utils/index.js'

test('#repository.fetch()', async t => {
  let redis = new ioredis()

  await t.beforeEach(() => deleteall(redis, 'chatroom'))
  await t.afterEach(() => deleteall(redis, 'chatroom'))
  await t.after(() => redis.disconnect())

  await t.test('existing object with 10 List items', async t => {
    let repo = new Repository(Chatroom, redis), room = null

    await t.beforeEach(async () => {
      await repo.save(new Chatroom({
        id: 'foo',
        users: Array.from({ length: 10 }, (_, i) => ({
          id: i, name: 'John-' + i
        }))
      }))
    })

    await t.test('calling repo.fetch() with the correct id', async t => {
      await t.beforeEach(async () => {
        room = await repo.fetch({ id: 'foo' })
      })

      await t.test('fetches back an object', () => {
        assert.ok(room)
      })

      await t.test('with the correct type', () => {
        assert.strictEqual(room.constructor.name, 'Chatroom')
      })

      await t.test('has the correct number of items', async t => {
        assert.strictEqual(room.users.length, 10)

        await t.test('each having a correct type', () => {
          room.users.forEach(user => {
            assert.strictEqual(user.constructor.name, 'User')
          })
        })
      })
    })
  })
})
