import { createHistogram } from 'node:perf_hooks'
import RingBuffer from './collector/ring-buffer/index.js'

class HistoricalHistogram {
  constructor({ initial = null }) {
    Object.defineProperties(this, {
      histogram: {
        value: createHistogram(),
        configurable: false,
        enumerable: true,
        writable: false
      },
      snapshots: {
        value: new RingBuffer(),
        configurable: false,
        enumerable: true,
        writable: false
      }
    })
    
    initial ? this.record(initial) : 0
  }
  
  record(value) {
    this.histogram.record(value)
    this.snapshots.push(this.histogram.toJSON())
  }
}

const histogram = new HistoricalHistogram({ initial: 10 })

console.log(histogram)
