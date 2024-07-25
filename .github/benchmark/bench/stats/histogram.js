import { createHistogram } from 'node:perf_hooks'

class Histogram {
  constructor({ name, values = [] }  = {}) {
    this.name = name
    this.values = values
    this.deltaKeys = {}
    this.percentiles = {}
    this.histogram = values.length
      ? this.#createHistogramFromValues(values)
      : createHistogram()

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

      this.values.push(Math.ceil(val))

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

    return this.values.length
  }

  record(val) {
    return this.histogram.record(val)
  }

  reset() {
    this.values = []
    return this.histogram.reset()
  }

  toClampedAverages(maxLength) {
    if (!Number.isSafeInteger(maxLength))
      throw new RangeError('"maxLength" must be a positive integer')

    return this.values.length < maxLength
      ? this.values
      : this.values.reduce((acc, value, i, arr) => {
        if (i % Math.ceil(this.values.length / maxLength) === 0)
          acc.push(createHistogram())

        acc.at(-1).record(value)

        return i === arr.length - 1
          ? [this.values.at(0)]
            .concat(acc.map(histogram => histogram.mean)).slice(0, acc.length - 1)
            .concat(this.values.at(-1))
          : acc
      }, [])
  }

  #createHistogramFromValues(values) {
    return values.reduce((histogram, value) => {
      histogram.record(value)

      return histogram
    }, createHistogram())
  }
}

export { Histogram }
