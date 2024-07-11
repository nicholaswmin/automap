import { styleText as c } from 'node:util'
import assert from 'node:assert'
import ioredis from 'ioredis'

import { test } from 'node:test'
import { createHistogram } from 'node:perf_hooks'

import { Repository } from '../../../../index.js'
import { Chatroom } from '../../../utils/model/index.js'
import {
  sizeKB,
  nanoToMs,
  deleteall,
  payloadKB,
  toHistogramMs
} from '../../../utils/utils.js'

test('perf: add 1k AppendList items, nested in 100 Lists', async t => {
  let redis = null

  await t.before(() => {
    console.info(c('yellow', 'note: next test can take > 2 minutes to run ...'))

    redis = new ioredis()
  })

  await t.after(() => redis.disconnect())

  await t.test('start with 0 List items', async t => {
    await t.beforeEach(() => deleteall(redis, 'chatroom'))
    await t.afterEach(() => deleteall(redis, 'chatroom'))

    await t.test('run 50 times, add a List item in each', async t => {
      await t.test('run 20 times, add an AppendList item in each', async t => {
        let histograms = {}

        await t.beforeEach(async () => {
          histograms = { fetch: createHistogram(), save: createHistogram() }

          const repo = new Repository(Chatroom, redis)

          const fetch = performance.timerify(repo.fetch.bind(repo), {
            histogram: histograms.fetch
          })

          const save = performance.timerify(repo.save.bind(repo), {
            histogram: histograms.save
          })

          for (let i = 0; i < 50; i++) {
            const room = await repo.fetch({ id: 'foo' }) || new Chatroom({
              id: 'foo'
            })

            if (room)
              room.addUser({ id: i, name: payloadKB(3) })

            await repo.save(room)

            for (let j = 0; j < 20; j++) {
              const room = await fetch({ id: 'foo' })

              const user = room.users.at(i)

              user.sendMessage({ id: j, text: payloadKB(3) })

              await save(room)
            }
          }
        })

        await t.test('3 randomly-picked AppendLists', async t => {
          // - picking `user:messages` of 3 random users
          const lists = await Promise.all([3, 20, 48].map(uid => {
            return redis.lrange(`chatroom:foo:users:${uid}:messages`, 0, -1)
          }))

          await t.test('are saved as Redis Lists', async t => {
            assert.strictEqual(lists.length, 3)

            await t.test('each contains 20 items', () => {
              lists.forEach(list => assert.strictEqual(list.length, 20))
            })

            await t.test('and each item is ~ 3kb', () => {
              lists.forEach((list, i) => {
                list.forEach((item, j) => {
                  const kb = sizeKB(item)

                  assert.ok(kb > 3, `list: ${i}, item: ${j} is: ${kb} kb`)
                  assert.ok(kb < 4, `list: ${i}, item: ${j} is: ${kb} kb`)
                })
              })
            })
          })
        })

        await t.test('durations', async t => {
          await t.before(() => console.table({
            '#fetch()': toHistogramMs(histograms.fetch),
            '#save()' : toHistogramMs(histograms.save)
          }))

          await t.test('#fetch', async t => {

            await t.test('ran 1000 times', () => {
              const count = histograms.fetch.count

              assert.strictEqual(count, 1000, `count is: ${count}`)
            })

            await t.test('mean is < 5 ms', () => {
              const ms = nanoToMs(histograms.fetch.mean)

              assert.ok(ms < 5, `value is: ${ms} ms`)
            })

            await t.test('deviation (stddev) is < 3 ms', () => {
              const ms = nanoToMs(histograms.fetch.stddev)

              assert.ok(ms < 3, `value is: ${ms} ms`)
            })
          })

          await t.test('#save', async t => {

            await t.test('ran 1000 times', () => {
              const count = histograms.save.count

              assert.strictEqual(count, 1000, `value is: ${count}`)
            })

            await t.test('mean is < 5 ms', () => {
              const ms = nanoToMs(histograms.save.mean)

              assert.ok(ms < 5, `value is: ${ms} ms`)
            })

            await t.test('deviation (stddev) is < 3 ms', () => {
              const ms = nanoToMs(histograms.save.stddev)

              assert.ok(ms < 3, `value is: ${ms} ms`)
            })
          })
        })
      })
    })
  })
})
