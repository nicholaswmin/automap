import cluster from 'node:cluster'
import ioredis from 'ioredis'
import input from '@inquirer/input'

import { TaskPerformanceTracker, primary, worker, } from './bench/index.js'

import { Paper } from './paper/index.js'
import { Repository } from '../../index.js'
import {
  flushall,
  randomId,
  payloadKB
} from '../../test/helpers/utils/index.js'

const constants = {
  WARMUP_SECONDS: 5,
  MAX_WORKER_BACKLOG: 10,
  TASKS_PER_SECOND: 100,
  MAX_BOARDS: 100,
  ITEM_PAYLOAD_KB: 5,
  NUM_WORKERS: 8
}

if (cluster.isPrimary) {
  for (const key of Object.keys(constants)) {
    const answer = await input({
      message: `Enter ${key}`,
      default: constants[key],
      validate: val => {
        return isNaN(val) || val === 0
          ? `${key} must be a positive, non-zero number`
          : true
      }
    })

    constants[key] = parseInt(answer)
  }

  primary({
    cluster,
    constants,
    before: async () => {
      await flushall()
    }
  })
} else {
  const tracker = new TaskPerformanceTracker({ constants })
  const redis = new ioredis()

  worker({
    constants,
    tracker,
    beforeEnd: async () => {
      redis.disconnect()
    },
    taskFn: async () => {
      const id = process.pid.toString()
      const repo  = new Repository(Paper, redis)
      const fetch = tracker.timerify(repo.fetch.bind(repo))
      const save  = tracker.timerify(repo.save.bind(repo))
      const latency = tracker.timerify(function redisPing() {
        return redis.ping()
      })
      const paper = await fetch({ id }) || new Paper({ id })
      const randBIndex = Math.floor(Math.random() * paper.boards.length)

      paper.boards.length < constants.MAX_BOARDS
        ? paper.addBoard({ id: randomId() })
        : null

      paper.boards.at(randBIndex).addItem(payloadKB(constants.ITEM_PAYLOAD_KB))

      await save(paper)

      await latency()
    }
  })
}
