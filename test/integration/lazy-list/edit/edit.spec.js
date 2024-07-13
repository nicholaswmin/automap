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

  await t.test('existing object with 10 Lazy List items', async t => {
    let repo = null, room = null

    await t.beforeEach(async () => {
      repo = new Repository(Chatroom, redis)

      await repo.save(new Chatroom({
        id: 'foo',
        posts: Array.from({ length: 10 }, (_, i) => ({
          id: i, content: 'Hello-' + i
        }))
      }))
    })

    await t.test('edit 5 items and save()', async t => {
      await t.beforeEach(async () => {
        room = await repo.fetch({ id: 'foo' })

        await room.posts.load(repo)

        for (let i = 5; i < 10; i++)
          room.posts.at(i).content = 'post-' + i

        await repo.save(room)
      })

      await t.test('calling repo.fetch(), then `.load() its List`', async t => {
        await t.beforeEach(async () => {
          room = await repo.fetch({ id: 'foo' })

          await room.posts.load(repo)
        })

        await t.test('has 10 items', async t => {
          assert.strictEqual(room.posts.length, 10)

          await t.test('last 5 are edited', () => {
            for (let i = 5; i < 10; i++)
              assert.strictEqual(room.posts.at(i).content, 'post-' + i)
          })

          await t.test('first 5 are not', () => {
            for (let i = 0; i < 5; i++)
              assert.ok(room.posts.at(i).content !== 'post-' + i)
          })
        })
      })
    })
  })
})
