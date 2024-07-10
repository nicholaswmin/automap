import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository } from '../../src/repository.js'
import { Chatroom } from '../model/index.js'

test('List:performance', async t => {
  const redis = new ioredis()
  const flushkeys = pattern =>
    redis.keys(pattern).then(keys =>
      keys.reduce((ppln, key) =>
        ppln.del(key), redis.pipeline()).exec())

  await t.test('#fetch() - do nothing - save()', async t => {
    let histograms = {}

    await t.before(() => flushkeys('chatroom:*'))
    await t.after(() =>  flushkeys('chatroom:*').then(() => redis.disconnect()))

    await t.test('50 cycles', async t => {
      await t.beforeEach(async () => {
        histograms = { fetch: createHistogram(), save: createHistogram() }

        const repo = new Repository(Chatroom, redis)

        const fetch = performance.timerify(repo.fetch.bind(repo), {
          histogram: histograms.fetch
        })

        const save = performance.timerify(repo.save.bind(repo), {
          histogram: histograms.save
        })

        for (let i = 0; i < 50; i++) {
          const chatroom = await fetch({ id: 'foo' }) || new Chatroom({
            id: 'foo',
            messages: [],
            users: Array.from({ length: 50 }, (_, i) => {
              return ({ id: `u_${i}`, name: 'John' })
            })
          })

          await save(chatroom)
        }
      })

      await t.test('#fetch', async t => {
        await t.test('ran 50 times', () => {
          const count = histograms.fetch.count

          assert.strictEqual(count, 50, `count is actually ${count}`)
        })

        await t.test('min duration is < 2 ms', () => {
          const ms = histograms.fetch.min / 1e+6

          assert.ok(ms < 2, `min duration is actually: ${ms} ms`)
        })

        await t.test('mean duration is < 3 ms', () => {
          const ms = histograms.fetch.mean / 1e+6

          assert.ok(ms < 3, `mean duration is actually: ${ms} ms`)
        })

        await t.test('max duration is < 20 ms', () => {
          const ms = histograms.fetch.max / 1e+6

          assert.ok(ms < 20, `'max duration is actually: ${ms} ms`)
        })

        await t.test('standard deviation is < 3 ms', () => {
          const ms = histograms.fetch.stddev / 1e+6

          assert.ok(ms < 3, `standard deviation is actually: ${ms} ms`)
        })
      })

      await t.test('#save', async t => {
        await t.test('ran 50 times', () => {
          const count = histograms.save.count

          assert.strictEqual(count, 50, `count is actually ${count}`)
        })

        await t.test('min duration is < 2 ms', () => {
          const ms = histograms.save.min / 1e+6

          assert.ok(ms < 2, `min duration is actually: ${ms} ms`)
        })

        await t.test('mean duration is < 3 ms', () => {
          const ms = histograms.save.mean / 1e+6

          assert.ok(ms < 3, `mean duration is actually: ${ms} ms`)
        })

        await t.test('max duration is < 20 ms', () => {
          const ms = histograms.save.max / 1e+6

          assert.ok(ms < 20, `'max duration is actually: ${ms} ms`)
        })

        await t.test('standard deviation is < 3 ms', () => {
          const ms = histograms.save.stddev / 1e+6

          assert.ok(ms < 3, `standard deviation is actually: ${ms} ms`)
        })
      })
    })
  })
})
