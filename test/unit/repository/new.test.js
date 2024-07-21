import test from 'node:test'
import ioredisMock from 'ioredis-mock'

import { Repository } from '../../../src/repository.js'
import { Building } from '../../util/model/index.js'

test('repository', async t => {
  let redis, repository

  t.beforeEach(() => {
    redis = new ioredisMock()
    repository = new Repository(Building, redis)
  })

  await t.test('instantiation', async t => {
    await t.test('"class" argument is missing', async t => {
      await t.test('throws an error', t => {
        t.assert.throws(() => new Repository())
      })
    })

    await t.test('"redis" argument is missing', async t => {
      await t.test('throws an error', t => {
        t.assert.throws(() => new Repository(Building))
      })
    })

    await t.test('both "class" and "redis" arguments are present', async t => {
      await t.test('instantiates', t => {
        t.assert.ok(repository)
      })
    })
  })
})
