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

    await t.test('calling repo.fetch()', async t => {
      await t.beforeEach(async () => {
        room = await repo.fetch('foo')
      })

      await t.test('fetches back the object', () => {
        assert.ok(room)
      })

      await t.test('with the correct type', () => {
        assert.strictEqual(room.constructor.name, 'Chatroom')
      })

      await t.test('with an empty LazyList', () => {
        assert.ok(Array.isArray(room.posts))
        assert.strictEqual(room.posts.length, 0)
      })
    })

    await t.test('calling list.load() once', async t => {
      await t.beforeEach(async () => {
        room = await repo.fetch('foo')

        await room.posts.load(repo)
      })

      await t.test('loads all 10 items', async t => {
        assert.strictEqual(room.posts.length, 10)

        await t.test('of the correct type', () => {
          room.posts.forEach(item => {
            assert.strictEqual(item.constructor.name, 'Post')
          })
        })

        await t.test('with correct properties', () => {
          room.posts.forEach((item, i) => {
            assert.strictEqual(item.id, i)
            assert.strictEqual(item.content, 'Hello-' + i)
          })
        })
      })
    })

    await t.test('calling list.load() multiple times', async t => {
      await t.beforeEach(async () => {
        room = await repo.fetch('foo')

        await room.posts.load(repo)
        await room.posts.load(repo)
      })

      await t.test('still loads only 10 items', () => {
        assert.strictEqual(room.posts.length, 10)
      })
    })
  })
})
