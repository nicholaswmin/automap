# Test

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
