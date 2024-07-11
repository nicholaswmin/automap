import assert from 'node:assert'
import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'
import ioredis from 'ioredis'

import { Repository, utils } from '../../../../index.js'
import { Chatroom } from '../../../utils/model/index.js'

test('perf: delete 100 List items', async t => {
  t.todo()
  const redis = new ioredis()

  await t.todo('start with 100 items', async t => {
    await t.beforeEach(() => {

    })
  })
})
