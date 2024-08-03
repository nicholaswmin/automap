import { createHistogram } from 'node:perf_hooks'

class Histogram {
  constructor({ name }  = {}) {
    this.name = name
    this.percentiles = {}
    this.last = 0
    this.histogram = createHistogram()

    ;[
      ['count', ''],
      ['exceeds', ''],
      ['min', 'ms'],
      ['mean', 'ms'],
      ['max', 'ms'],
      ['stddev', 'ms'],
      ['percentiles', 'ms'],
    ].forEach(([key, postfix]) => {
      if (key !== 'percentiles') {
        ;[key, postfix ? `${key}_${postfix.trim()}` : null].forEach(prop => {
          if (prop) Object.defineProperty(this, prop, {
            get: function() { return this.histogram.toJSON()[key] }
          })
        })

        return
      }

      Object.defineProperty(this, key, {
        get: function() {
          const json = this.histogram.toJSON()

          return Object.keys(json.percentiles).reduce((acc, key) => ({
            ...acc, [key]: json.percentiles[key]
          }))
        }
      })
    })

    this.histogramRecord = this.histogram.record.bind(this.histogram)
    this.histogram.record = val => {
      const rounded = Math.round(val)
      const result = rounded > 0 ? this.histogramRecord(rounded) : null
      
      this.last = rounded

      return result
    }
  }

  tick() {
    this.record(1)
  }

  record(val) {
    return this.histogram.record(val)
  }

  reset() {
    return this.histogram.reset()
  }
  
  toJSON() {
    return {
      last: this.last,
      ...this.histogram.toJSON()
    }
  }
}

export default Histogram
