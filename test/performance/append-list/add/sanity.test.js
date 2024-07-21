import test from 'node:test'
import { styleText } from 'node:util'
import ioredis from 'ioredis'
import { Repository } from '../../../../index.js'
import { Building, Flat } from '../../../util/model/index.js'
import { payloadKB } from '../../../util/index.js'
import { timerify, log } from '@nicholaswmin/timerify'

test('AppendList, sanity test', async t => {
  let saveCount = 0
  const syntheticaly_slow_save = async obj => {
    await new Promise(resolve => setTimeout(resolve, saveCount += 0.5))
    return await repo.save(obj)
  }

  const title = t.fullName,
        repo = new Repository(Building, new ioredis({ keyPrefix: 'test:' })),
        save = timerify(syntheticaly_slow_save)

  await t.before(async () => {
    await repo.redis.flushall()

    console.log(styleText('yellow', 'note: slow test ( > 1 minute)'))
  })

  await t.after(async () => {
    repo.redis.disconnect()
  })

  await t.test('monkey-patch "save()" to synthetically get slower', async t => {
    for (let i = 0; i < 10; i++) {
      const building = await repo.fetch('foo') || new Building({ id: 'foo' })

      building.flats.push(new Flat({ id: i }))

      await repo.save(building)
    }

    await t.test('for each AppendList', async t => {
      await t.test('x 10 times', async t => {
        await t.test('add 1 AppendList item & save()', async t => {
          for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
              const building = await repo.fetch('foo')

              const flat = building.flats.at(i)

              flat.addMail({ id: j, text: payloadKB(3) })

              await save(building)
            }
          }

          await t.test('logs stats', () => log([save], { title }))

          await t.test('detects a high but synthetic mean increase', t => {
            const mean = save.stats_ms.mean

            t.assert.ok(mean > 10, `mean is: ${mean} ms`)
          })

          await t.test('detects a high but synthetic deviation increase', t => {
            const deviation = save.stats_ms.stddev

             t.assert.ok(deviation > 5, `deviation is: ${deviation} ms`)
          })
        })
      })
    })
  })
})
