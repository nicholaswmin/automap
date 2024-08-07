import test from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building, Flat } from '../../../util/model/index.js'

import { payloadKB } from '../../../util/index.js'
import { timerify, log } from '@nicholaswmin/timerify'

test('List, flat, add items: x 200 times', async t => {
  const title = t.fullName,
        repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' })),
        fetch = timerify(repo.fetch.bind(repo)),
        save = timerify(repo.save.bind(repo))

  t.before(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('x 200 times', async t => {
    await t.test('add 1 List with 1 item & save()', async t => {
      for (let i = 0; i < 200; i++) {
        const building = await fetch('foo') || new Building({ id: 'foo' })

        building.flats.push(new Flat({ id: i, bedrooms: payloadKB(3) }))

        await save(building)
      }

      await t.test('logs stats', () => log([fetch, save], { title }))

      await t.test('saves the list items', async t => {
         t.assert.ok(
          await repo.redis.hgetall('building:foo:flats')
         )
      })

      await t.test('fetch()', async t => {
        await t.test('is called 200 times', t => {
          const count = fetch.stats_ms.count

          t.assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('takes on average < 5 ms', t => {
          const mean = fetch.stats_ms.mean

           t.assert.ok(mean < 10, `mean is: ${mean} ms`)
        })

        await t.test('has consistent running times', t => {
          const deviation = fetch.stats_ms.stddev

          t.assert.ok(deviation < 3, `deviation is: ${deviation} ms`)
        })
      })

      await t.test('save()', async t => {
        await t.test('is called 200 times', t => {
          const count = save.stats_ms.count

          t.assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('takes on average < 5 ms', t => {
          const mean = save.stats_ms.mean

          t.assert.ok(mean < 10, `mean is: ${mean} ms`)
        })

        await t.test('has consistent running times', t => {
          const deviation = save.stats_ms.stddev

          t.assert.ok(deviation < 3, `deviation is: ${deviation} ms`)
        })
      })
    })
  })
})
