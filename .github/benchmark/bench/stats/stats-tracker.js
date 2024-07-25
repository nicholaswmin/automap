import { Recordable } from './recordable.js'
import { localbus } from './local-bus.js'

class PrimaryStatsTracker {
  constructor(keys = []) {
    Object.assign(this, keys.reduce((acc, key) => {
      return { ...acc, [key]: new Recordable({ name: key }) }
    }, {}))
  }

  getRow() {
    return Object.values(this)
      .filter(val => val instanceof Recordable)
      .reduce((acc, member) => {
        return {
          ...acc, [member.name]: member.histogram.toJSON()
        }
    }, {})
  }

  publish() {
    localbus.emit('stats:row:update', this.getRow())
  }
}

class WorkerStatsTracker extends PrimaryStatsTracker {
  constructor(...args) {
    super(...args)
  }

  publish() {
    process.send({ type: 'stats:row:update', row: this.getRow() })
  }
}

class WorkerObservedStatsTracker extends WorkerStatsTracker {
  constructor(entryTypes) {
    super()

    this.observer = new PerformanceObserver(list => {
      const json = list.getEntries().pop().toJSON()
      const entry = { ...json, name: json.name.replace('bound ', '').trim() }

      this[entry.name] = this[entry.name] || new Recordable(entry)
      this[entry.name].record(entry.duration)
    })

    this.observer.observe({ entryTypes })
  }

  publish() {
    process.send({ type: 'stats:row:update', row: this.getRow() })
  }
}

export { PrimaryStatsTracker, WorkerStatsTracker, WorkerObservedStatsTracker }
