import os from 'node:os'
import cluster from 'node:cluster'
import ioredis from 'ioredis'

import { Building, Flat } from '../../test/util/model/index.js'
import { Repository } from '../../index.js'

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

const constants = {
  TASKS_PER_SECOND: 100,
  MAX_FLATS: 100,
  ITEM_PAYLOAD_KB: 5,
  MAX_WORKER_BACKLOG: 10,
  NUM_WORKERS: process.env.WEB_CONCURRENCY || os.availableParallelism(),
  MAX_STATS_UPDATE_PER_SECOND: 10,
  WARMUP_SECONDS: 5
}

if (cluster.isPrimary) {
  const REDIS_URL = process.env.REDIS_TLS_URL || process.env.REDIS_URL || null
  const IS_HEROKU = Object.hasOwn(process.env, 'HEROKU_APP_NAME')

  const redis = new ioredis(REDIS_URL, {
    keyPrefix: 'test:',
    tls: {
      rejectUnauthorized: false
    }
  })

  await userDefineConstants(constants)

  primary({
    cluster,
    constants,
    before: async () => redis.flushall(),
    after: async () => redis.disconnect()
  })
} else {
  // Worker
  const constants = await loadConstants()
  const REDIS_URL = process.env.REDIS_TLS_URL || process.env.REDIS_URL || null
  const IS_HEROKU = Object.hasOwn(process.env, 'HEROKU_APP_NAME')

  const tracker = new TaskPerformanceTracker({ constants })

  const redis = new ioredis(REDIS_URL, {
    keyPrefix: 'test:',
    tls: {
      rejectUnauthorized: false
    }
  })

  worker({
    tracker,
    after: () => {},
    forEach: async () => {
      const id = process.pid.toString()
      const repo  = new Repository(Building, redis)

      const redis_ping = () => redis.ping()
      const fetch = performance.timerify(repo.fetch.bind(repo))
      const save  = performance.timerify(repo.save.bind(repo))
      const ping = performance.timerify(redis_ping)

      const building = await fetch(id) || new Building({ id })
      const randIndex = Math.floor(Math.random() * building.flats.length)

      building.flats.length < constants.MAX_FLATS
        ? building.flats.push(new Flat({ id: randomId() }))
        : null

      building.flats.at(randIndex).addMail({
        id: randomId(),
        text: payloadKB(constants.ITEM_PAYLOAD_KB)
      })

      await save(building)

      await ping()
    }
  })
}
