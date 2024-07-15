import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { payloadKB, timerify } from '../../../util/index.js'

test('loading LazyLists', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('when 100 "load" LazyLists are loaded', async t => {
    let loadlist = null

    t.beforeEach(async () => {
      loadlist = null

      await repo.save(new Building({
        id: 'foo',
        visitors: Array.from({ length: 200 }, (_, i) => ({
          id: i,
          name: payloadKB(3)
        }))
      }))

      for (let i = 0; i < 100; i++) {
        const building = await repo.fetch('foo')

        loadlist = timerify(
          building.visitors.load.bind(building.visitors),
          loadlist?.histogram // reuse histogram if set
        )

        await loadlist(repo)
      }
    })

    await t.test('logs timing stats', () =>
      setImmediate(() => console.table({
        loadlist: loadlist.histogram_ms
      })))

    await t.test('loads its list items promptly', async t => {
      await t.test('runs 100 times', () => {
        const count = loadlist.histogram_ms.count

        assert.strictEqual(count, 100, `count was: ${count}`)
      })

      await t.test('takes on average < 3 ms per list load()', () => {
        const mean = loadlist.histogram_ms.mean

        assert.ok(mean < 3, `was: ${mean} ms`)
      })

      await t.test('with consistent durations throughout', () => {
        const deviation = loadlist.histogram_ms.stddev

        assert.ok(deviation < 3, `was: ${deviation} ms`)
      })
    })
  })
})
