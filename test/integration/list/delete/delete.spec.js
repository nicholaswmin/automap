import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Chatroom } from '../../../utils/model/index.js'
import { deleteall } from '../../../utils/utils.js'

test('#repository.del()', { todo: true }, async t => {
  let redis = new ioredis()

  await t.beforeEach(() => deleteall(redis, 'chatroom'))
  await t.afterEach(() => deleteall(redis, 'chatroom'))
  await t.after(() => redis.disconnect())

  await t.test('delete existing object with 10 List items', async t => {
    let repo = new Repository(Chatroom, redis), room = null

    await t.beforeEach(async () => {
      room = new Chatroom({ id: 'foo' })

      for (let i = 0; i < 10; i++)
        room.addUser({ id: i, name: 'John-' + i })

      await repo.save(room)
    })

    await t.test('@todo', () => {
      assert.ok('foo bar')
    })
  })
})
