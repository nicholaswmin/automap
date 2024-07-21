import { randomNum, randomId } from './random.js'
import { round } from './numbers.js'

// size of object
const sizeBytes = item => {
  if (typeof item === 'undefined' || !item)
    throw new Error('passed item is falsy')

  const str = typeof item === 'string' ? item : JSON.stringify(item)

  return round(new Blob([str]).size)
}
const sizeKB = item => round(sizeBytes(item) / 1000)

// size conversion
const toMB = bytes => round(bytes / 1000 / 1000)

// payload
const payloadKB = kb => {
  return JSON.stringify({
    ...JSON.parse(`["Path",{"applyMatrix":true,"data":{"guid":"${randomId()}"},"segments":[${`[${randomNum()}, ${randomNum()}]`}],"strokeColor":[0.6141276000612308,0.0073291996604683, 0.20695908748200353],"strokeWidth":2,"strokeCap":"round","strokeJoin":"round"}]`),
    segments: Array.from({
      length: 63 * kb
    }, () => [ randomNum(), randomNum() ])
  })
}

export {
  sizeBytes,
  sizeKB,

  payloadKB,

  toMB
}
