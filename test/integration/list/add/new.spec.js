import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Chatroom } from '../../../utils/model/index.js'
import { deleteall } from '../../../utils/utils.js'

test('#repository.save()', async t => {
  let redis = new ioredis()

  await t.beforeEach(() => deleteall(redis, 'chatroom'))
  await t.afterEach(() => deleteall(redis, 'chatroom'))
  await t.after(() => redis.disconnect())

  await t.test('new object', async t => {
    let repo = new Repository(Chatroom, redis), room = null

    await t.test('add 10 list item', async t => {
      await t.beforeEach(async () => {
        room = new Chatroom({ id: 'foo' })

        for (let i = 0; i < 10; i++)
          room.addUser({ id: i, name: 'John-' + i })

        await repo.save(room)
      })

      await t.test('fetching back the object', async t => {
        await t.beforeEach(async () => {
          room = await repo.fetch({ id: 'foo' })
        })

        await t.test('fetches the object', () => {
          assert.ok(room)
        })

        await t.test('has a "users" property', async t => {
          assert.ok(Object.hasOwn(room, 'users'))

          await t.test('which is an Array', () => {
            assert.ok(Array.isArray(room.users))
          })
        })

        await t.test('with the added items', () => {
          assert.strictEqual(room.users.length, 10)
        })

        await t.test('each has the specified properties', async t => {
          await t.test('the id', () => {
            room.users.forEach((user, i) =>
              assert.strictEqual(user.id, i))
          })

          await t.test('the name', () => {
            room.users.forEach((user, i) =>
              assert.strictEqual(user.name, 'John-' + i))
          })
        })
      })

      await t.test('items are saved as a Redis Hash', async t => {
        let items = null

        await t.beforeEach(async () => {
          items = await redis.hgetall('chatroom:foo:users')
        })

        await t.test('under a human readable path', () => {
          assert.ok(items, 'cant find Redis Hash: "chatroom:foo:users"')
        })

        await t.test('all items are saved', () => {
          assert.strictEqual(Object.keys(items).length, 10)
        })
      })
    })
  })
})
