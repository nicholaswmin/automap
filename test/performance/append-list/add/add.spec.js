import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { nanoToMs, payloadKB, histogramMs } from '../../../util/index.js'

test('adding AppendList items', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('run 100 times', async t => {
    await t.test('adding a new item each time', async t => {
      let histograms = { fetch: null, save: null }

      t.beforeEach(async () => {
        histograms = { fetch: createHistogram(), save: createHistogram() }

        const fetch = performance.timerify(repo.fetch.bind(repo), {
          histogram: histograms.fetch
        })
        const save = performance.timerify(repo.save.bind(repo), {
          histogram: histograms.save
        })

        for (let i = 0; i < 100; i++) {
          const building = await fetch('foo') || new Building({
            id: 'foo', flats: [{ id: 1 }]
          })

          building.flats.at(0).addMail({ id: i, text: payloadKB(3) })

          await save(building)
        }
      })

      await t.test('has saved items', async () => {
        assert.ok(await repo.redis.lrange('building:foo:flats:0:mail', 0, -1))
      })

      await t.test('#fetch', async t => {
        t.before(() => console.table({
          '#fetch()': histogramMs(histograms.fetch),
          '#save()' : histogramMs(histograms.save)
        }))

        await t.test('ran 100 times', () => {
          const count = histograms.fetch.count

          assert.strictEqual(count, 100, `count was: ${count}`)
        })

        await t.test('mean duration was < 6 ms', () => {
          const mean = nanoToMs(histograms.fetch.mean)

          assert.ok(mean < 6, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 3 ms', () => {
          const deviation = nanoToMs(histograms.fetch.stddev)

          assert.ok(deviation < 3, `was: ${deviation} ms`)
        })
      })

      await t.test('#save', async t => {
        await t.test('ran 100 times', () => {
          const count = histograms.save.count

          assert.strictEqual(count, 100, `ran: ${count} times`)
        })

        await t.test('mean duration was < 6 ms', () => {
          const mean = nanoToMs(histograms.save.mean)

          assert.ok(mean < 6, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 5 ms', () => {
          const deviation = nanoToMs(histograms.save.stddev)

          assert.ok(deviation < 5, `was: ${deviation} ms`)
        })
      })
    })
  })
})
