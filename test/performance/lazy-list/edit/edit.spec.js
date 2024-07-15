import assert from 'node:assert'
import { test } from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'
import { payloadKB, timerify } from '../../../util/index.js'

test('editing LazyList items', async t => {
  const repo = new Repository(Building, new ioredis())

  t.beforeEach(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('when 250 "fetch -> edit -> save" cycles run', async t => {
    let fetch, save, loadlist

    t.beforeEach(async () => {
      fetch = timerify(repo.fetch.bind(repo))
      save = timerify(repo.save.bind(repo))
      loadlist = null

      await repo.save(new Building({
        id: 'foo',
        visitors: Array.from({ length: 250 }, (_, i) => ({
          id: i,
          name: 'jane' + i
        }))
      }))

      for (let i = 0; i < 250; i++) {
        const building = await fetch('foo')

        loadlist = timerify(
          building.visitors.load.bind(building.visitors),
          loadlist?.histogram // reuse histogram if set
        )

        await loadlist(repo)

        building.visitors.at(i).name = payloadKB(5)

        await save(building)
      }
    })

    await t.test('saves its items', async () => {
      assert.ok(await repo.redis.hgetall('building:foo:flats:0:mail'))
    })

    await t.test('logs timing stats', () =>
      setImmediate(() => console.table({
        fetch: fetch.histogram_ms,
        loadlist: loadlist.histogram_ms,
        save: fetch.histogram_ms
      })))

    await t.test('loads its list items promptly', async t => {
      await t.test('runs 250 times', () => {
        const count = loadlist.histogram_ms.count

        assert.strictEqual(count, 250, `count was: ${count}`)
      })

      await t.test('takes on average < 5 ms per list load()', () => {
        const mean = loadlist.histogram_ms.mean
        assert.ok(mean < 3, `was: ${mean} ms`)
      })

      await t.test('with consistent durations throughout', () => {
        const deviation = loadlist.histogram_ms.stddev

        assert.ok(deviation < 5, `was: ${deviation} ms`)
      })
    })

    await t.test('fetches the objects promptly', async t => {
      await t.test('runs 250 times', () => {
        const count = fetch.histogram_ms.count

        assert.strictEqual(count, 250, `count was: ${count}`)
      })

      await t.test('takes on average < 5 ms per fetch()', () => {
        const mean = fetch.histogram_ms.mean

        assert.ok(mean < 3, `was: ${mean} ms`)
      })

      await t.test('with consistent durations throughout', () => {
        const deviation = fetch.histogram_ms.stddev

        assert.ok(deviation < 5, `was: ${deviation} ms`)
      })
    })

    await t.test('saves the objects promptly', async t => {
      await t.test('runs 250 times', () => {
        const count = save.histogram_ms.count

        assert.strictEqual(count, 250, `ran: ${count} times`)
      })

      await t.test('takes on average < 5 ms per save()', () => {
        const mean = save.histogram_ms.mean

        assert.ok(mean < 5, `was: ${mean} ms`)
      })

      await t.test('with consistent durations throughout', () => {
        const deviation = save.histogram_ms.stddev

        assert.ok(deviation < 5, `was: ${deviation} ms`)
      })
    })
  })
})
