// Tests if `repository.save(object)` performance is within acceptable limits
import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis-mock'

import { Repository } from '../../../../src/repository.js'
import { Chatroom } from '../../../model/index.js'

test('repository', async t => {
  await t.test('#fetch', async t => {
    await t.todo('performance', async t => {
      // @TODO Implement

      await t.beforeEach(async () => {
        const repo = new Repository(Chatroom, new ioredis())

        assert.ok(repo)
      })
    })
  })
})
