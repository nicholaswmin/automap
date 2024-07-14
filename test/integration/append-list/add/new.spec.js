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

  await t.test('new object', async t => {
    let repo = new Repository(Chatroom, redis), room = null

    await t.test('run 10 times', async t => {
      await t.test('add 1 new AppendList item each time', async t => {
        await t.beforeEach(async () => {
          for (let i = 0; i < 10; i++) {
            room = await repo.fetch('foo') || new Chatroom({
              id: 'foo',
              messages: Array.from({ length: 10 }, (_, i) => ({
                id: i, text: 'message-' + i
              }))
            })

            if (room)
              room.addMessage({ id: i, text: 'hello-world-' + i })

            await repo.save(room)
          }
        })

        await t.test('calling repo.fetch()', async t => {
          await t.beforeEach(async () => {
            room = await repo.fetch('foo')
          })

          await t.test('fetches the object', () => {
            assert.ok(room)
          })

          await t.test('has no items', () => {
            assert.strictEqual(room.messages.length, 0)
          })
        })

        await t.test('items are saved in a Redis List', async t => {
          let items = null

          await t.beforeEach(async () => {
            items = await redis.lrange('chatroom:foo:messages', 0, -1)
          })

          await t.test('under a human readable path', () => {
            assert.ok(items, 'cant find Redis Hash: "chatroom:foo:messages"')
          })

          await t.test('all items are saved', () => {
            assert.strictEqual(Object.keys(items).length, 10)
          })
        })
      })
    })
  })
})
