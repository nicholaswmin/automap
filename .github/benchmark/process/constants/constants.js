import os from 'node:os'
import input from '@inquirer/input'

import { getRedisURL } from './redis-url.js'

const constants = {
  public: {
    TASKS_PER_SECOND: 100,
    NUM_WORKERS: process.env.WEB_CONCURRENCY || os.availableParallelism(),
    DURATION_SECONDS: 240,
    STATS_PER_SECOND: 5,

    MAX_ITEMS: 100,
    ITEM_PAYLOAD_KB: 5,
    MAX_BACKLOG: 100
  },
  private: {
    REDIS_URL: await getRedisURL()
  }
}

export default async () => {
  for (const key of Object.keys(constants.public)) {
    const answer = await input({
      message: `Enter ${key}:`,
      default: constants.public[key],
      validate: val => {
        return isNaN(val) || val <= 0
          ? `${key} must be a positive, non-zero number`
          : true
      }
    })

    constants.public[key] = Number(answer)
  }

  return constants
}
