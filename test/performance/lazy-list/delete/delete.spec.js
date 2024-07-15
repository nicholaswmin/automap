import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'

test('deleting items from LazyList', { todo: true }, async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('when 100 LazyLists are deleted', async t => {
    t.beforeEach(() => { })

    await t.test('@todo', () => {
      assert.ok('foo bar')
    })
  })
})
