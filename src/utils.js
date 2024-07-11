import crypto from 'node:crypto'

import ioredis from 'ioredis'
import ioredisMock from 'ioredis-mock'

// Number

const round = num => Math.round((num + Number.EPSILON) * 100) / 100
const nanoToMs = ns => round(ns / 1e+6)

// histograms

const toHistogramMs = (histogram, title = '') => {
  const { percentiles, exceeds, ...obj } = { ...histogram.toJSON() }

  return Object.keys(obj)
    .sort((a, b) => a - b)
    .reduce((acc, key) => ({
      ...acc, [isNaN(key) ? key + (key === 'count' ? '' : ' (ms)') :
        (+key).toFixed(2) ]: key === 'count' ? obj[key] : nanoToMs(obj[key])
    }), {})
}
// Randoms

const randomID = () => crypto.randomUUID().split('-').at(-1)
const randomNum = (min = -300, max = 600) =>
  round(Math.random() * (max - min) + min)

// Payload

const payloadKB = kb => {
  return JSON.stringify({
    ...JSON.parse(`["Path",{"applyMatrix":true,"data":{"guid":"${randomID()}"},"segments":[${`[${randomNum()}, ${randomNum()}]`}],"strokeColor":[0.6141276000612308,0.0073291996604683, 0.20695908748200353],"strokeWidth":2,"strokeCap":"round","strokeJoin":"round"}]`),
    segments: Array.from({
      length: 63 * kb
    }, () => [ randomNum(), randomNum() ])
  })
}

// size value converter

const toMB = bytes => round(bytes / 1000 / 1000)

// Size of

const sizeKB = item => round(sizeBytes(item) / 1000)
const sizeBytes = item => {
  if (typeof item === 'undefined' || !item)
    throw new Error('passed item is falsy')

  const str = typeof item === 'string' ? item : JSON.stringify(item)

  return round(new Blob([str]).size)
}

// Redis

// delete key and any pattern after it,
// i.e passing `user` deletes key `user` & all `user:*`
const deleteall = (redis, id) =>
  redis.keys(id + ':*').then(keys =>
    keys.reduce((ppl, id) => ppl.del(id),
      redis.pipeline().del(id)).exec())

const createRedis = () => ['development', undefined]
  .includes(process.env.NODE_ENV) ?
    new ioredis() :
    new ioredis({
      url: process.env.REDIS_URL,
      tlsOptions: { tls: { rejectUnauthorized: false } }
    })


const utils = {
  ioredis: { mock: ioredisMock, real: createRedis },
  deleteall,

  round,
  nanoToMs,
  toHistogramMs,

  randomID,
  randomNum,

  payloadKB,

  toMB,

  sizeKB
}

export { utils }
