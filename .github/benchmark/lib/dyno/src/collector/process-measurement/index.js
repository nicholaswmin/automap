import { createHistogram } from 'node:perf_hooks'
import RingBuffer from '../ring-buffer/index.js'

class ProcessMeasurement {
  constructor({ name, value }) {
    this.createHistoricalHistogram({ name, value })
  }
  
  createHistoricalHistogram({ name, value }) {
    Object.defineProperty(this, name, {
      value: new HistoricalHistogram({ initial: value }),
      configurable: false,
      enumerable: true,
      writable: false
    })
  }
}

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

export { ProcessMeasurement }
