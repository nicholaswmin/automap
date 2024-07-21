import test from 'node:test'
import ioredis from 'ioredis'

import { Repository } from '../../../../index.js'
import { Building } from '../../../util/model/index.js'

import { payloadKB } from '../../../util/index.js'
import { timerify, log } from '@nicholaswmin/timerify'

test('LazyList, flat, load list: x 200 times', async t => {
  let load = null

  const title = t.fullName,
        repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' }))

  t.before(() => repo.redis.flushall())
  t.after(() => repo.redis.disconnect())

  await t.test('has existing LazyList with 200 x 5kb items', async t => {
    await repo.save(new Building({
      id: 'foo',
      visitors: Array.from({ length: 200 }, (_, i) => ({
        id: i,
        name: payloadKB(5)
      }))
    }))

    await t.test('loading the list x 200 times', async t => {
      for (let i = 0; i < 200; i++) {
        const building = await repo.fetch('foo')

        if (!load)
          load = timerify(building.visitors.load.bind(building.visitors))

        await load(repo)
      }

      await t.test('logs stats', () => log([load], { title }))

      await t.test('load()', async t => {
        await t.test('is called 200 times', t => {
          const count = load.stats_ms.count

           t.assert.strictEqual(count, 200, `ran: ${count} times`)
        })

        await t.test('takes on average < 5 ms', t => {
          const mean = load.stats_ms.mean

           t.assert.ok(mean < 5, `mean is: ${mean} ms`)
        })

        await t.test('has consistent running times', t => {
          const deviation = load.stats_ms.stddev

           t.assert.ok(deviation < 5, `deviation is: ${deviation} ms`)
        })
      })
    })
  })
})
