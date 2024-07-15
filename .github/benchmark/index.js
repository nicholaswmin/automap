import os from 'node:os'
import cluster from 'node:cluster'
import ioredis from 'ioredis'

import { Paper } from './paper/index.js'
import { Repository } from '../../index.js'

import {
  userDefineConstants,
  TaskPerformanceTracker,
  primary,
  worker
} from './bench/index.js'

import {
  flushall,
  randomId,
  payloadKB
} from '../../test/util/utils/index.js'

const constants = {
  TASKS_PER_SECOND: 100,
  MAX_BOARDS: 100,
  ITEM_PAYLOAD_KB: 5,
  MAX_WORKER_BACKLOG: 10,

  NUM_WORKERS: process.env.WEB_CONCURRENCY || os.availableParallelism(),
  MAX_UPDATE_PER_SECOND: 10,
  WARMUP_SECONDS: 5
}

if (cluster.isPrimary) {
  // Primary
  await userDefineConstants(constants)
  primary({ cluster, constants, before: async () => flushall() })
} else {
  // Worker
  const tracker = new TaskPerformanceTracker({ constants })
  const redis = new ioredis(process.env.REDIS_URL, {
    tls: process.env.REDIS_URL?.includes('rediss') ? {
      rejectUnauthorized: false
    } : undefined
  })

  worker({
    tracker,
    after: () => redis.disconnect(),
    forEach: async () => {
      const id = process.pid.toString()
      const repo  = new Repository(Paper, redis)

      const redis_ping = () => redis.ping()
      const fetch = performance.timerify(repo.fetch.bind(repo))
      const save  = performance.timerify(repo.save.bind(repo))
      const ping = performance.timerify(redis_ping)

      const paper = await fetch(id) || new Paper({ id })
      const randBIndex = Math.floor(Math.random() * paper.boards.length)

      paper.boards.length < constants.MAX_BOARDS
        ? paper.addBoard({ id: randomId() })
        : null

      paper.boards.at(randBIndex).addItem(payloadKB(constants.ITEM_PAYLOAD_KB))

      await save(paper)

      await ping()
    }
  })
}
