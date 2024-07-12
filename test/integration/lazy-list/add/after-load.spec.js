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

  await t.test('existing object with 10 LazyList items', async t => {
    let repo = new Repository(Chatroom, redis), room = null

    await t.beforeEach(async () => {
      await repo.save(new Chatroom({
        id: 'foo',
        posts: Array.from({ length: 10 }, (_, i) => ({
          id: i, content: 'Hello-' + i
        }))
      }))
    })

    await t.test('fetch object, list.load() & add 10 items', async t => {
      await t.beforeEach(async () => {
        room = await repo.fetch({ id: 'foo' })

        await room.posts.load(repo)

        assert(room.posts.length, 10)

        for (let i = 10; i < 20; i++)
          room.addPost({ id: i, content: 'post-' + i })

        await repo.save(room)
      })

      await t.test('fetch back the object', async t => {
        await t.beforeEach(async () => {
          room = await repo.fetch({ id: 'foo' })
        })

        await t.test('load its list', async t => {
          await t.beforeEach(async () => {
            await room.posts.load(repo)
          })

          await t.test('has the previous + new items', () => {
            assert.strictEqual(room.posts.length, 20)
          })
        })
      })

      await t.test('items are saved as a Redis Hash', async t => {
        let items = null

        await t.beforeEach(async () => {
          items = await redis.hgetall('chatroom:foo:posts')
        })

        await t.test('under a human readable path', () => {
          assert.ok(items, 'cant find Redis Hash: "chatroom:foo:posts"')
        })

        await t.test('all items are saved', () => {
          assert.strictEqual(Object.keys(items).length, 20)
        })
      })
    })
  })
})
