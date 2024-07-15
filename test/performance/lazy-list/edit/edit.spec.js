import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { nanoToMs, payloadKB, histogramMs } from '../../../util/index.js'

test('edit LazyList items', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('run 200 times', async t => {
    await t.test('adding a new item each time', async t => {
      let histograms = { fetch: null, loadLazyList: null, save: null }

      t.beforeEach(async () => {
        histograms = {
          fetch: createHistogram(),
          loadLazyList: createHistogram(),
          save: createHistogram()
        }

        const fetch = performance.timerify(repo.fetch.bind(repo), {
          histogram: histograms.fetch
        })
        const save = performance.timerify(repo.save.bind(repo), {
          histogram: histograms.save
        })

        await repo.save(new Building({
          id: 'foo',
          offices: Array.from({ length: 200 }, (_, i) => ({
            id: i,
            department: 'dept-' + i
          }))
        }))

        for (let i = 0; i < 200; i++) {
          const building = await fetch('foo')

          const loadLazyList = performance.timerify(
            building.offices.load.bind(building.offices),
            { histogram: histograms.loadLazyList })

          await loadLazyList(repo)
          building.offices.at(i).department = payloadKB(5)

          await save(building)
        }
      })

      t.after(() => setImmediate(() => console.table({
        '#fetch()': histogramMs(histograms.fetch),
        '#loadLazyList()' : histogramMs(histograms.loadLazyList),
        '#save()' : histogramMs(histograms.save)
      })))

      await t.test('has saved items', async () => {
        assert.ok(await repo.redis.hgetall('building:foo:flats:0:mail'))
      })

      await t.test('#fetch', async t => {
        await t.test('ran 200 times', () => {
          const count = histograms.fetch.count

          assert.strictEqual(count, 200, `count was: ${count}`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(histograms.fetch.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(histograms.fetch.stddev)

          assert.ok(deviation < 3, `was: ${deviation} ms`)
        })
      })

      await t.test('#loadLazyList', async t => {
        await t.test('ran 200 times', () => {
          const count = histograms.loadLazyList.count

          assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(histograms.loadLazyList.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(histograms.loadLazyList.stddev)

          assert.ok(deviation < 2, `was: ${deviation} ms`)
        })
      })

      await t.test('#save', async t => {
        await t.test('ran 200 times', () => {
          const count = histograms.save.count

          assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(histograms.save.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(histograms.save.stddev)

          assert.ok(deviation < 3, `was: ${deviation} ms`)
        })
      })
    })
  })
})
