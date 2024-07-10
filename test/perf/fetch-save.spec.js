import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository } from '../../src/repository.js'
import { Chatroom } from '../model/index.js'

test('performance', async t => {
  const redis = new ioredis()
  const flushkeys = pattern =>
    redis.keys(pattern).then(keys =>
      keys.reduce((ppln, key) =>
        ppln.del(key), redis.pipeline()).exec())

  await t.test('#fetch() - do nothing - save()', async t => {
    let histograms = {}

    await t.before(() => flushkeys('chatroom:*'))
    await t.after(() =>  flushkeys('chatroom:*').then(() => redis.disconnect()))

    await t.test('run 50 times', async t => {
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
        await t.test('has ran 50 times', () => {
          const count = histograms.fetch.count

          assert.strictEqual(count, 50, `recorded value is: ${count}`)
        })

        await t.test('min duration is under 2 ms', () => {
          const ms = histograms.fetch.min / 1e+6

          assert.ok(ms < 2, `recorded value is: ${ms} ms`)
        })

        await t.test('mean duration is under 3 ms', () => {
          const ms = histograms.fetch.mean / 1e+6

          assert.ok(ms < 3, `recorded value is: ${ms} ms`)
        })

        await t.test('max duration is under 20 ms', () => {
          const ms = histograms.fetch.max / 1e+6

          assert.ok(ms < 20, `recorded value is: ${ms} ms`)
        })

        await t.test('standard deviation is under 3 ms', () => {
          const ms = histograms.fetch.stddev / 1e+6

          assert.ok(ms < 3, `recorded value is: ${ms} ms`)
        })
      })

      await t.test('#save', async t => {
        await t.test('has ran 50 times', () => {
          const count = histograms.save.count

          assert.strictEqual(count, 50, `recorded value is: ${count}`)
        })

        await t.test('min duration is under 2 ms', () => {
          const ms = histograms.save.min / 1e+6

          assert.ok(ms < 2, `recorded value is: ${ms} ms`)
        })

        await t.test('mean duration is under 3 ms', () => {
          const ms = histograms.save.mean / 1e+6

          assert.ok(ms < 3, `recorded value is: ${ms} ms`)
        })

        await t.test('max duration is under 20 ms', () => {
          const ms = histograms.save.max / 1e+6

          assert.ok(ms < 20, `recorded value is: ${ms} ms`)
        })

        await t.test('standard deviation is under 3 ms', () => {
          const ms = histograms.save.stddev / 1e+6

          assert.ok(ms < 3, `recorded value is: ${ms} ms`)
        })
      })
    })
  })
})
