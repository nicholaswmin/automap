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
      value: 1000
    },
    THREAD_COUNT: {
      configurable: true,
      value: 2
    },
    DURATION_SECONDS: {
      configurable: true,
      value: 5
    },
    MAX_ITEMS: {
      configurable: false,
      value: 100
    },
    PAYLOAD_KB: {
      configurable: true,
      value: 5
    },
    MAX_BACKLOG: {
      configurable: true,
      value: 10
    }
  }),

  fields: {
    primary: [
      ['sent.count', 'tasks sent'],
      ['replies.count', 'tasks acked'],
      ['memory.mean', 'memory (mean/mb)', toMB],
      ['uptime.count', 'seconds']
    ],
    threads: {
      'thread stats': {
        sortby: 'max backlog',
        fields: [
          ['task.count', 'tasks run'],
          ['memory.mean', 'memory (mean/mb)', toMB],
          ['backlog.max', 'max backlog']
        ]
      },
      'thread timings': {
        sortby: 'task (mean/ms)',
        fields: [
          ['task.mean', 'task (mean/ms)', round],
          ['redis_ping.mean', 'latency (mean/ms)', round],
          ['fetch.mean', 'fetch (mean/ms)', round],
          ['save.mean', 'save (mean/ms)', round]
        ]
      }
    }
  }
})

await dyno.start()
