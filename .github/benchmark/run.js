import os from 'node:os'

import { Dyno, configure } from './lib/dyno/index.js'
import ioredis from './lib/ioredis/index.js'

const round = num => Math.round((num + Number.EPSILON) * 100) / 100
const toMB = bytes => round(bytes / 1000 / 1000)
const redis = ioredis()

const dyno = new Dyno({
  task: './task.js',

  before: () => {
    return redis.flushall()
  },

  after: () => {
    return redis.disconnect()
  },

  parameters: await configure({
    TASKS_SECOND: {
      configurable: true,
      type: Number,
      value: 50
    },
    
    THREAD_COUNT: {
      configurable: true,
      type: Number,
      value: process.env.WEB_CONCURRENCY || os.availableParallelism()
    },
    
    DURATION_SECONDS: {
      configurable: true,
      type: Number,
      value: 60
    },
    
    MAX_ITEMS: {
      configurable: false,
      type: Number,
      value: 100
    },
    
    PAYLOAD_KB: 5 // its valid, non-configurable
  }),

  fields: {
    parameters: [
      ['parameters.PAYLOAD_KB', 'PAYLOAD_KB']
    ],
    runner: [
      ['sent.count', 'tasks sent'],
      ['replies.count', 'tasks acked'],
      ['memory.mean', 'memory (mean/mb)', toMB],
      ['uptime.count', 'uptime seconds']
    ],
    threads: {
      sortby: 'task.mean',
      plotted: [ ['task'], ['redis_ping', 'latency'], ['fetch'], ['save'] ],
      tabular: [
        ['task.mean', 'task', round],
        ['redis_ping.mean', 'latency', round],
        ['fetch.mean', 'fetch', round],
        ['save.mean', 'save', round],
        ['---', '---'],
        ['backlog.max', 'max backlog'],
        ['task.count', 'tasks run'],
        ['memory.mean', 'memory (mb)', toMB],
        ['gc.mean', 'GC duration', round],
        ['gc.count', 'GC cycles']
      ]
    }
  }
})

await dyno.start()
