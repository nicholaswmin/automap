import Histogram from './histogram.js'
import localbus from './local-bus.js'

class StatsTracker {
  constructor(keys = []) {
    this.stopped = false

    Object.assign(this, keys.reduce((acc, key) => {
      return { ...acc, [key]: new Histogram({ name: key }) }
    }, {}))
  }

  getRow() {
    return Object.values(this)
      .filter(val => val instanceof Histogram)
      .reduce((acc, member) => {
        return {
          ...acc, [member.name]: member.toJSON()
        }
    }, {})
  }

  publish() {
    localbus.emit('stats:row:update', this.getRow())
  }

  stop() {
    localbus.removeAllListeners('stats:row:update')
  }
}

class RemoteStatsTracker extends StatsTracker {
  constructor(...args) {
    super(...args)
  }

  publish() {
    return process.connected
      ? process.send({ type: 'stats:row:update', row: this.getRow() })
      : null
  }

  stop() {
    // noop
  }
}

class PerformanceRemoteStatsTracker extends RemoteStatsTracker {
  constructor(entryTypes) {
    super()

    this.observer = new PerformanceObserver(list => {
      list.getEntries()
        .map(entry => entry.toJSON())
        .map(json => ({
          ...json,
          name: json.name.replace('bound ', '').trim()
        }))
        .forEach(entry => {
          this[entry.name] = this[entry.name] || new Histogram(entry)
          this[entry.name].record(entry.duration)
        })

      performance.clearMeasures()
      performance.clearResourceTimings()
    })

    this.observer.observe({ entryTypes })
  }

  stop() {
    super.stop()
    this.observer.disconnect()
  }
}

export { StatsTracker, RemoteStatsTracker, PerformanceRemoteStatsTracker }
