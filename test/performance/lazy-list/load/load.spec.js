import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { nanoToMs, payloadKB, timerify } from '../../../util/index.js'

test('load LazyLists', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('run 200 times', async t => {
    await t.test('load a LazyList each time', async t => {
      let loadList = null

      t.beforeEach(async () => {
        loadList = null

        await repo.save(new Building({
          id: 'foo',
          offices: Array.from({ length: 200 }, (_, i) => ({
            id: i,
            department: payloadKB(3)
          }))
        }))

        for (let i = 0; i < 200; i++) {
          const building = await repo.fetch('foo')

          loadList = timerify(
            building.offices.load.bind(building.offices),
            loadList?.histogram // reuse histogram if set
          )

          await loadList(repo)
        }
      })

      t.after(() => process.nextTick(() => {
        console.table({ '#loadList': loadList.toHistogramMillis() })
      }))

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
    })
  })
})
