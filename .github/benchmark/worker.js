import ioredis from 'ioredis'

import { worker } from './lib/bench/index.js'
import { randomId, payloadKB } from '../../test/util/index.js'
import { Building, Flat } from '../../test/util/model/index.js'
import { Repository } from '../../index.js'

export default async () => {
  const constants = JSON.parse(process.env.constants)
  const redis = new ioredis(constants.private.REDIS_URL, {
    keyPrefix: 'test:',
    tls: constants.private.REDIS_URL?.includes('rediss') ? {
      rejectUnauthorized: false
    } : undefined
  })

  const id = process.pid.toString()
  const repo = new Repository(Building, redis)

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
