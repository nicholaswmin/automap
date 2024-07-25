import { thread } from './lib/dyno/index.js'
import ioredis from './lib/ioredis/index.js'

import { randomId, payloadKB } from '../../test/util/index.js'
import { Building, Flat } from '../../test/util/model/index.js'
import { Repository } from '../../index.js'

const redis = ioredis()

const id = process.pid.toString()
const redis_ping = () => redis.ping()
const repo  = new Repository(Building, redis)
const fetch = performance.timerify(repo.fetch.bind(repo))
const save  = performance.timerify(repo.save.bind(repo))
const ping  = performance.timerify(redis_ping)

thread(async parameters => {
  const building = await fetch(id) || new Building({ id })
  const randIndex = Math.floor(Math.random() * building.flats.length)

  building.flats.length < parameters.MAX_ITEMS
    ? building.flats.push(new Flat({ id: randomId() }))
    : null

  building.flats.at(randIndex).addMail({
    id: randomId(),
    text: payloadKB(parameters.PAYLOAD_KB)
  })

  await save(building)

  await ping()
})
