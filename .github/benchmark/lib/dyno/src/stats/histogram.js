import { createHistogram } from 'node:perf_hooks'

class Histogram {
  constructor({ name }  = {}) {
    this.name = name
    this.deltaKeys = {}
    this.percentiles = {}
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
      const result = this.histogramRecord(Math.ceil(val))

      return result
    }
  }

  recordDelta(key = 'any') {
    if (typeof key !== 'string')
      throw new RangeError('"key" must be a string with length')

    if (!this.deltaKeys[key]) {
      this.deltaKeys[key] = performance.now()

      return 0
    }

    const delta = parseInt(performance.now() - this.deltaKeys[key])

    this.record(delta)

    this.deltaKeys[key] = performance.now()

    return delta
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
}

export default Histogram
