import os from 'node:os'
import cluster from 'node:cluster'
import { styleText as c } from 'node:util'
import ioredis from 'ioredis'

import { Building, Flat } from '../../test/util/model/index.js'
import { Repository } from '../../index.js'
import { getRedisURL } from './redis-url.js'

import {
  userDefineConstants,
  TaskPerformanceTracker,
  loadConstants,
  primary,
  worker
} from './bench/index.js'

import {
  randomId,
  payloadKB
} from '../../test/util/index.js'

if (cluster.isPrimary) {
  console.clear()
  console.log(c('blueBright', 'Starting up...'))

  const constants = await userDefineConstants({
    public: {
      TASKS_PER_SECOND: 3000,
      MAX_FLATS: 100,
      ITEM_PAYLOAD_KB: 5,
      MAX_WORKER_BACKLOG: 100,
      NUM_WORKERS: process.env.WEB_CONCURRENCY || os.availableParallelism(),
      MAX_STATS_UPDATE_PER_SECOND: 5,
      MAX_WORKERS_DISPLAY: 5,
      WARMUP_SECONDS: 5
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
    constants,
    before: async () => redis.flushall(),
    after: async () => redis.disconnect()
  })
} else {
  // Worker

  const constants = await loadConstants()
  const tracker = new TaskPerformanceTracker({ constants })
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
  const ping = performance.timerify(redis_ping)

  worker({
    tracker,
    after: () => redis.disconnect(),
    taskFn: async () => {
      const building = await fetch(id) || new Building({ id })
      const randIndex = Math.floor(Math.random() * building.flats.length)

      building.flats.length < constants.public.MAX_FLATS
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
