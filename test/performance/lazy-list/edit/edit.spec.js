import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { nanoToMs, payloadKB, timerify } from '../../../util/index.js'
import { LOADIPHLPAPI } from 'node:dns/promises'

test('edit LazyList items', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('run 200 times', async t => {
    await t.test('adding a new item each time', async t => {
     let fetch, loadList, save = null

      t.beforeEach(async () => {
        fetch = timerify(repo.fetch.bind(repo))
        loadList = null
        save = timerify(repo.save.bind(repo))

        await repo.save(new Building({
          id: 'foo',
          offices: Array.from({ length: 200 }, (_, i) => ({
            id: i,
            department: 'dept-' + i
          }))
        }))

        for (let i = 0; i < 200; i++) {
          const building = await fetch('foo')

          loadList = timerify(
            building.offices.load.bind(building.offices),
            loadList?.histogram // reuse histogram if set
          )

          await loadList(repo)

          building.offices.at(i).department = payloadKB(5)

          await save(building)
        }
      })

      t.after(() => process.nextTick(() => {
        console.table({
          '#fetch': fetch.toHistogramMillis(),
          '#loadList': loadList.toHistogramMillis(),
          '#save': save.toHistogramMillis()
        })
      }))

      await t.test('has saved items', async () => {
        assert.ok(await repo.redis.hgetall('building:foo:flats:0:mail'))
      })

      await t.test('#fetch', async t => {
        await t.test('ran 200 times', () => {
          const count = fetch.histogram.count

          assert.strictEqual(count, 200, `count was: ${count}`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(fetch.histogram.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(fetch.histogram.stddev)

          assert.ok(deviation < 3, `was: ${deviation} ms`)
        })
      })

      await t.test('#loadList', async t => {
        await t.test('ran 200 times', () => {
          const count = loadList.histogram.count

          assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(loadList.histogram.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(loadList.histogram.stddev)

          assert.ok(deviation < 2, `was: ${deviation} ms`)
        })
      })

      await t.test('#save', async t => {
        await t.test('ran 200 times', () => {
          const count = save.histogram.count

          assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('mean duration was < 3 ms', () => {
          const mean = nanoToMs(save.histogram.mean)

          assert.ok(mean < 3, `was: ${mean} ms`)
        })

        await t.test('duration deviation was < 2 ms', () => {
          const deviation = nanoToMs(save.histogram.stddev)

          assert.ok(deviation < 3, `was: ${deviation} ms`)
        })
      })
    })
  })
})
