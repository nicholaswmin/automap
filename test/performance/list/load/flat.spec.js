import test from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'

import { payloadKB } from '../../../util/index.js'
import { timerify, log } from '@nicholaswmin/timerify'

test('List, flat, load list, x 200 times', async t => {
  const title = t.fullName,
        repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' })),
        fetch = timerify(repo.fetch.bind(repo)),
        results = []

  await t.before(() => repo.redis.flushall())
  await t.after(async () => repo.redis.disconnect())

  await t.test('for each existing List', async t => {
    await repo.save(new Building({
      id: 'foo',
      flats: Array.from({ length: 200 }, (_, i) => ({
        id: i, name: payloadKB(3)
      }))
    }))

    await t.test('load each object', async t => {
      for (let i = 0; i < 200; i++) {
        const building = await fetch('foo')

        results.push(building)
      }

      await t.test('logs stats', () => log([fetch], { title }))

      await t.test('has 200 list items', t => {
        t.assert.strictEqual(results.length, 200)
      })

      await t.test('fetch()', async t => {
        await t.test('is called 200 times', t => {
          const count = fetch.stats_ms.count

           t.assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('takes on average < 5 ms', t => {
          const mean = fetch.stats_ms.mean

           t.assert.ok(mean < 5, `mean is: ${mean} ms`)
        })

        await t.test('has consistent running times', t => {
          const deviation = fetch.stats_ms.stddev

           t.assert.ok(deviation < 5, `deviation is: ${deviation} ms`)
        })
      })
    })
  })
})
