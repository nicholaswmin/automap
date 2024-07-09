import assert from 'node:assert'
import { test } from 'node:test'
import ioredisMock from 'ioredis-mock'

import { Repository } from '../../src/repository.js'
import { Chatroom } from '../model/index.js'

test('repository', async t => {
  let redis, repository

  await t.beforeEach(() => {
    redis = new ioredisMock()
    repository = new Repository(Chatroom, redis)
  })

  await t.test('instantiation', async t => {
    await t.test('"class" argument is missing', async t => {
      await t.test('throws an error', () => {
        assert.throws(() => new Repository())
      })
    })

    await t.test('"redis" argument is missing', async t => {
      await t.test('throws an error', () => {
        assert.throws(() => new Repository(Chatroom))
      })
    })

    await t.test('both "class" and "redis" arguments are present', async t => {
      await t.test('instantiates', () => {
        assert.ok(repository)
      })
    })
  })
})
