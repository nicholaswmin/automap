import { styleText as style } from 'node:util'
import { Table, printTable } from 'console-table-printer'

import utils from './src/utils.js'
import performanceEntryViews from './src/performance-entry-views.js'

class PerformanceRunner {
  constructor({ title = 'Performance Runner', views = [] } = {}) {
    this.tasks = []
    this.entries = []
    this.views = { ...performanceEntryViews, ...views }

    this.observer = new PerformanceObserver(this.#observerCallback.bind(this))
    this.entryTypes = PerformanceObserver.supportedEntryTypes
    this.observer.observe({ entryTypes: this.entryTypes })

    this.table = new Table({ title, columns: [
        { name: 'type', alignment: 'right' },
        { name: 'name', alignment: 'right' },
        { name: 'value', alignment: 'left' }
      ]
    })
  }

  async run(tasks = []) {
    this.tasks = tasks

    for (let task of tasks) {
      performance.mark('memoryUsage', {
        detail: { value: utils.toMB(process.memoryUsage().heapUsed) + ' MB' }
      })

      for (let i = 0; i < task.times; i++) {
        await performance.timerify(task.fn)({ i, step: task.name })
      }
    }
  }

  async end() {
    await this.#onEventLoopEnd()
    this.observer.disconnect()

    this.entries = this.entries.concat(this.observer.takeRecords()).flat()
    this.separator = this.#computeSeparator(this.entries, this.tasks)

    this.createHeader('startup')

    this.entries.forEach(entry => {
      const step = Object.hasOwn(entry.detail?.[0] || {}, 'step')
      const view = this.views[step ? 'cycle' : entry.entryType]

      return this.table.addRow(view(this, entry))
    })

    this.table.printTable()
  }

  createHeader(name) {
    this.table.addRows([
      this.separator,
      { type: '', name: style(['magenta', 'bold'], name), value: '' },
      this.separator
    ])

    return this
  }

  createSeparator() {
    this.table.addRow(this.separator)

    return this
  }

  #observerCallback(items) {
    this.entries.push(items.getEntries().map(entry => entry.toJSON()))
  }

  #computeSeparator(entries, tasks, { padding = 2 } = {}) {
    const maxTimesLen = Math.max(...tasks.map(t => String(t.times).length))
    const maxTypesLen = Math.max(...entries.map(e => e.entryType.length))
    const maxnNameLen = Math.max(...entries.map(e => e.name.length))
    const maxValueLen = Math.max(...entries.map(e => {
      return (e.detail?.value || utils.round(e.duration)).toString().length
    }))

    return {
      type: '-'.repeat(maxTypesLen),
      name: '-'.repeat(maxTimesLen + maxnNameLen + ':'.length + padding),
      value: '-'.repeat(maxValueLen + padding)
    }
  }

  #onEventLoopEnd() {
    return new Promise(resolve => setImmediate(() => resolve()))
  }
}

export { PerformanceRunner }
