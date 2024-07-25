import os from 'node:os'
import cluster from 'node:cluster'
import { styleText as c } from 'node:util'
import ioredis from 'ioredis'

import { getRedisURL } from './redis-url.js'
import { primary, worker, set, load } from './bench/index.js'
import { randomId, payloadKB } from '../../test/util/index.js'

import { Building, Flat } from '../../test/util/model/index.js'
import { Repository } from '../../index.js'

if (cluster.isPrimary) {
  console.log(c('blueBright', 'Starting up...'))

  const concurrency = process.env.WEB_CONCURRENCY || os.availableParallelism()
  const round = num => Math.round((num + Number.EPSILON) * 100) / 100
  const toMB = bytes => round(bytes / 1000 / 1000)

  const constants = await set({
    public: {
      TASKS_PER_SECOND: 100,
      NUM_WORKERS: concurrency,
      DURATION_SECONDS: 240,
      STATS_PER_SECOND: 5,

      MAX_ITEMS: 100,
      ITEM_PAYLOAD_KB: 5,
      MAX_BACKLOG: 100
    },
    private: {
      REDIS_URL: await getRedisURL()
    }
  })

  const redis = new ioredis(constants.private.REDIS_URL, {
    keyPrefix: 'test:',
    tls: constants.private.REDIS_URL?.includes('rediss') ? {
      rejectUnauthorized: false
    } : undefined
  })

  primary({
    cluster,
    fields: {
      general: {
        Constants: [
          [constants.public.TASKS_PER_SECOND, 'TASKS_PER_SECOND'],
          [constants.public.NUM_WORKERS, 'NUM_WORKERS'],
          [constants.public.DURATION_SECONDS, 'DURATION_SECONDS'],

          [constants.public.MAX_ITEMS, 'MAX_ITEMS'],
          [constants.public.ITEM_PAYLOAD_KB, 'ITEM_PAYLOAD_KB'],
          [constants.public.MAX_BACKLOG, 'MAX_BACKLOG']
        ]
      },
      primary: [
        ['sent.count', 'tasks sent'],
        ['replies.count', 'tasks acked'],
        ['memory.mean', 'memory (mean/mb)', toMB]
      ],
      workers: {
        'Worker stats': {
          sortby: 'max backlog',
          fields: [
            ['task.count', 'tasks run'],
            ['memory.mean', 'memory (mean/mb)', toMB],
            ['backlog.max', 'max backlog']
          ]
        },
        'Worker timings': {
          sortby: 'task (mean/ms)',
          fields: [
            ['task.mean', 'task (mean/ms)', round],
            ['redis_ping.mean', 'latency (mean/ms)', round],
            ['fetch.mean', 'fetch (mean/ms)', round],
            ['save.mean', 'save (mean/ms)', round]
          ]
        }
      }
    },
    numWorkers: constants.public.NUM_WORKERS,
    tasksPerSecond: constants.public.TASKS_PER_SECOND,
    durationSeconds: constants.public.DURATION_SECONDS,
    statsPerSecond: constants.public.STATS_PER_SECOND,
    before: async () => redis.flushall(),
    after: async () => redis.disconnect()
  })
} else {
  // Worker

  const constants = await load()
  const redis = new ioredis(constants.private.REDIS_URL, {
    keyPrefix: 'test:',
    tls: constants.private.REDIS_URL?.includes('rediss') ? {
      rejectUnauthorized: false
    } : undefined
  })

  const id = process.pid.toString()
  const repo  = new Repository(Building, redis)

  const redis_ping = () => redis.ping()
  const fetch = performance.timerify(repo.fetch.bind(repo))
  const save  = performance.timerify(repo.save.bind(repo))
  const ping  = performance.timerify(redis_ping)

  worker({
    after: () => redis.disconnect(),
    taskFn: async () => {
      const building = await fetch(id) || new Building({ id })
      const randIndex = Math.floor(Math.random() * building.flats.length)

      building.flats.length < constants.public.MAX_ITEMS
        ? building.flats.push(new Flat({ id: randomId() }))
        : null

      building.flats.at(randIndex).addMail({
        id: randomId(),
        text: payloadKB(constants.public.ITEM_PAYLOAD_KB)
      })

      await save(building)

      await ping()
    }
  })
}
