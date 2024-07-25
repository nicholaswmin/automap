import ioredis from 'ioredis'

import { primary } from '../bench/index.js'

export default async (cluster, constants) => {
  const round = num => Math.round((num + Number.EPSILON) * 100) / 100
  const toMB = bytes => round(bytes / 1000 / 1000)

  const redis = new ioredis(constants.private.REDIS_URL, {
    keyPrefix: 'test:',
    tls: constants.private.REDIS_URL?.includes('rediss') ? {
      rejectUnauthorized: false
    } : undefined
  })

  primary({
    cluster,
    constants,
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
}
