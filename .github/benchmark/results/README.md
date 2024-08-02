# Benchmark

All tests were:

- run on the Heroku Platform
- run on a Review App within a Pipeline

## Task

These benchmarks used the following `task`:

```js
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
```

## Model

The above `task` used the following `model`

```js
import { List, AppendList, LazyList } from '../../../index.js'

const random = () => Math.random().toString().slice(5, 10)

class Building {
  constructor({ id = random(), mail = [], visitors = [], flats = [] } = {}) {
    this.id = id

    this.mail = new AppendList({
      from: mail,
      type: Mail
    })

    this.visitors = new LazyList({
      from: visitors,
      type: Person
    })

    this.flats = new List({
      from: flats,
      type: Flat
    })
  }
}

class Person {
  constructor({ id = random(), name = 'John' } = {}) {
    this.id = id
    this.name = name
  }
}

class Flat {
  constructor({ id = random(), bedrooms = 2, visitors = [], mail = [] } = {}) {
    this.id = id
    this.bedrooms = bedrooms

    this.visitors = new LazyList({
      from: visitors,
      type: Person
    })

    this.mail = new AppendList({
      type: Mail,
      from: mail
    })
  }

  ringDoorbell() {
    console.log('🔔 at flat', this.id)
  }

  addMail({ id = null, text = null } = {}) {
    this.mail.push(new Mail({ id, text }))
  }
}

class Mail {
  constructor({ id = random(), text = 'hi' } = {}) {
    this.id = id
    this.text = text
  }
}

export { Building, Person, Flat, Mail }

```
