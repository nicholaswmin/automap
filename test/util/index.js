import crypto from 'node:crypto'
import { createHistogram } from 'node:perf_hooks'
import ioredis from 'ioredis'
import ioredisMock from 'ioredis-mock'

// Numbers

const round = num => Math.round((num + Number.EPSILON) * 100) / 100
const nanoToMs = ns => round(ns / 1e+6)

// Performance

// - performance.timery-fies a function and attaches a histogram
//   on the function itself, for easy access, i.e:
// ```js
// const foo = timerify(fooFn)
//
// console.log(foo.histogram.max) // logs nanoseconds
// console.log(foo.histogram_ms.max) // logs milliseconds
// ````
// - Reuse a histogram by passing a previous one as the 2nd parameter
//
// See: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
const timerify = (func, histogram = createHistogram()) => {
  const timerified = performance.timerify(func, { histogram })

  timerified.histogram = histogram

  timerified.histogram_ms = {
    get count () { return histogram.count },
    get min() { return nanoToMs(histogram.min) },
    get mean () { return nanoToMs(histogram.mean) },
    get max () { return nanoToMs(histogram.max) },
    get stddev () { return nanoToMs(histogram.mean) }
  }

  return timerified
}

// Randoms

const randomId = () => crypto.randomUUID().split('-').at(-1)
const randomNum = (min = -300, max = 600) =>
  round(Math.random() * (max - min) + min)

// Payloads

const payloadKB = kb => {
  return JSON.stringify({
    ...JSON.parse(`["Path",{"applyMatrix":true,"data":{"guid":"${randomId()}"},"segments":[${`[${randomNum()}, ${randomNum()}]`}],"strokeColor":[0.6141276000612308,0.0073291996604683, 0.20695908748200353],"strokeWidth":2,"strokeCap":"round","strokeJoin":"round"}]`),
    segments: Array.from({
      length: 63 * kb
    }, () => [ randomNum(), randomNum() ])
  })
}

// Size converions

const toMB = bytes => round(bytes / 1000 / 1000)
const sizeKB = item => round(sizeBytes(item) / 1000)

// Size of object

const sizeBytes = item => {
  if (typeof item === 'undefined' || !item)
    throw new Error('passed item is falsy')

  const str = typeof item === 'string' ? item : JSON.stringify(item)

  return round(new Blob([str]).size)
}

// Redis

const flushall = async () => {
  const redis = new ioredis(process.env.REDIS_URL, {
    tls: process.env.REDIS_URL?.includes('rediss') ? {
      rejectUnauthorized: false
    } : undefined
  })
  const response = await redis.flushall()
  redis.disconnect()

  console.log('FLUSHALL:', response)
}

// deletes a key and any pattern after it,
// i.e passing `user` deletes key `user`, `user:*`
const deleteall = (redis, id) =>
  redis.keys(id + ':*').then(keys =>
    keys.reduce((ppl, id) => ppl.del(id),
      redis.pipeline().del(id)).exec())

const ioredisClient = () => ['development', undefined]
  .includes(process.env.NODE_ENV) ?
    new ioredis() :
    new ioredis(process.env.REDIS_URL, {
      tls: process.env.REDIS_URL?.includes('rediss') ? {
        rejectUnauthorized: false
      } : undefined
    })

export {
  ioredisMock,
  ioredisClient,
  deleteall,
  flushall,

  round,
  nanoToMs,

  timerify,

  randomId,
  randomNum,

  payloadKB,

  toMB,

  sizeKB
}
