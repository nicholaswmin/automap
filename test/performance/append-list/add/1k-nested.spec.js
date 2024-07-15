import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository } from '../../../../index.js'
import { Building, Flat } from '../../../util/model/index.js'
import { nanoToMs, payloadKB, histogramMs } from '../../../util/index.js'

test('adding 1k AppendList items, nested in 100 Lists', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('run 100 times', async t => {
    await t.test('run 20 times for each time', async t => {
      await t.test('each time add an item', async t => {
        let histograms = { fetch: null, save: null }

        t.beforeEach(async () => {
          histograms = { fetch: createHistogram(), save: createHistogram() }

          const fetch = performance.timerify(repo.fetch.bind(repo), {
            histogram: histograms.fetch
          })
          const save = performance.timerify(repo.save.bind(repo), {
            histogram: histograms.save
          })

          for (let i = 0; i < 50; i++) {
            const building = await repo.fetch('foo') || new Building({
              id: 'foo'
            })

            building.flats.push(new Flat({ id: i }))

            await repo.save(building)

            for (let j = 0; j < 20; j++) {
              const building = await fetch('foo')

              const flat = building.flats.at(i)

              flat.addMail({ id: j, text: payloadKB(3) })

              await save(building)
            }
           }
        })

        t.after(() => setImmediate(() => console.table({
          '#fetch()': histogramMs(histograms.fetch),
          '#loadLazyList()' : histogramMs(histograms.loadLazyList),
          '#save()' : histogramMs(histograms.save)
        })))

        await t.test('has saved items', async () => {
          assert.ok(await repo.redis.lrange('building:foo:flats:0:mail', 0, -1))
        })

        await t.test('#fetch', async t => {
          t.before(() => console.table({
            '#fetch()': histogramMs(histograms.fetch),
            '#save()' : histogramMs(histograms.save)
          }))

          await t.test('ran 1000 times', () => {
            const count = histograms.fetch.count
            assert.strictEqual(count, 1000, `count was: ${count}`)
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

        await t.test('#save', async t => {
          await t.test('ran 1000 times', () => {
            const count = histograms.save.count
            assert.strictEqual(count, 1000, `ran: ${count} times`)
          })

          await t.test('mean duration was < 3 ms', () => {
            const mean = nanoToMs(histograms.save.mean)
            assert.ok(mean < 3, `was: ${mean} ms`)
          })

          await t.test('duration deviation was < 2 ms', () => {
            const deviation = nanoToMs(histograms.save.stddev)
            assert.ok(deviation < 5, `was: ${deviation} ms`)
          })
        })
      })
    })
  })
})
