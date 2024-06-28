import { styleText as style } from 'node:util'
import { Table, printTable } from 'console-table-printer'

import performanceEntryViews from './src/performance-entry-views.js'
import errors from './src/errors.js'
import utils from './src/utils.js'

class PerformanceRunner {
  #ended

  constructor() {
    this.tasks = []
    this.entries = []
    this.currentTable = null
    this.#ended = false

    this.observer = new PerformanceObserver(this.#observerCallback.bind(this))
    this.entryTypes = PerformanceObserver.supportedEntryTypes
    this.observer.observe({ entryTypes: this.entryTypes })
  }

  async run(tasks = []) {
    this.tasks = tasks

    for (let task of tasks) {
      performance.mark('memoryUsage', {
        detail: {
          value: utils.toMB(process.memoryUsage().heapUsed),
          unit: 'mb'
        }
      })

      for (let i = 0; i < task.times; i++) {
        await performance.timerify(task.fn)({ i: i + 1, step: task.name })
      }
    }
  }

  async end() {
    await this.#onEventLoopEnd()
    this.observer.disconnect()

    this.entries = this.entries.concat(this.observer.takeRecords()).flat()

    this.#ended = true
  }

  printTimeline() {
    this.#throwIfRunning()

    this.currentTable = new Table({
      title: 'timeline',
      columns: [
        { name: 'type', alignment: 'right' },
        { name: 'name', alignment: 'right' },
        { name: 'value', alignment: 'left' }
      ]
    })

    this.currentTable.addRows([
      this.computeSeparator(['type', 'name', 'value']),
      { type: 'Startup' },
      this.computeSeparator(['type', 'name', 'value'])
    ])

    this.entries.forEach(entry => {
      const step = Object.hasOwn(entry.detail?.[0] || {}, 'step')
      const view = performanceEntryViews[step ? 'cycle' : entry.entryType]

      return this.currentTable.addRow(view(this, entry))
    })

    this.currentTable.printTable()

    return this
  }

  async printAverages() {
    this.#throwIfRunning()

    this.currentTable = new Table({
      title: 'average stats',
      columns: [
        { name: 'name', alignment: 'right' },
        { name: 'count', alignment: 'right' },
        { name: 'min', alignment: 'left' },
        { name: 'max', alignment: 'left' },
        { name: 'average', alignment: 'left' }
      ]
    })

    const units = this.#computeMarkUnits(this.entries)
    const colors = this.#computeMarkColors(this.entries)
    const columns = ['name', 'count', 'min', 'max', 'average']
    const taskStats = this.#computeTaskStats(this.entries)
    const markStats = this.#computeMarkStats(this.entries)
    const measureStats = this.#computeMeasureStats(this.entries)
    const separator = this.computeSeparator(columns)
    const taskView = row => {
      return {
        'name': style('magenta', row.name),
        'count': row.count,
        'min': utils.toMillis(row.min),
        'max': style('yellow', utils.toMillis(row.max)),
        'average': style('green', utils.toMillis(row.average))
      }
    }
    const markView = row => {
      const color = colors[row.name]
      const unit = units[row.name] ? ' ' + units[row.name] : ''

      return {
        'name': style(color, row.name),
        'count': row.count,
        'min': utils.round(row.min) + unit,
        'max': style('yellow', utils.round(row.max) + unit),
        'average': style('green', utils.round(row.average) + unit)
      }
    }

    if (taskStats.length) {
      this.currentTable.addRows([
        this.computeSeparator(columns),
        { name: 'Tasks' },
        this.computeSeparator(columns)
      ])

      taskStats.sort((a, b) => b.average - a.average)
        .forEach(row => this.currentTable.addRow(taskView(row)))
    }

    if (markStats.length) {
      this.currentTable.addRows([
        this.computeSeparator(columns),
        { name: 'Marks' },
        this.computeSeparator(columns)
      ])

      markStats.sort((a, b) => b.average - a.average)
        .forEach(row => this.currentTable.addRow(markView(row)))
    }

    if (measureStats.length) {
      this.currentTable.addRows([
        this.computeSeparator(columns),
        { name : 'Measure' },
        this.computeSeparator(columns)
      ])

      measureStats.sort((a, b) => b.average - a.average)
        .forEach(row => this.currentTable.addRow(markView(row)))
    }

    this.currentTable.printTable()

    return this
  }

  computeSeparator(keys) {
    return keys.reduce((acc, key) => {
      acc[key] = ''

      return acc
    }, {})
  }

  #computeTaskStats(entries) {
    return entries
      .filter(entry => entry.detail?.[0]?.step)
      .map(entry => ({
        ...entry,
        key: entry.detail?.[0]?.step,
        value: entry.duration
      }))
      .reduce(this.#computeEntryStats, [])
  }

  #computeMarkStats(entries) {
    return entries
      .filter(entry => entry.entryType === 'mark' && entry.detail?.value)
      .map(entry => ({ ...entry, key: entry.name, value: entry.detail.value }))
      .reduce(this.#computeEntryStats, [])
  }

  #computeMeasureStats(entries) {
    return entries
      .filter(entry => entry.entryType === 'measure')
      .map(entry => ({ ...entry, key: entry.name, value: entry.duration }))
      .reduce(this.#computeEntryStats, [])
  }

  #computeEntryStats(acc, entry, i, arr) {
    acc[entry.key] = acc[entry.key] ? {
      max: entry.value > acc[entry.key].max ? entry.value : acc[entry.key].max,
      min: entry.value < acc[entry.key].min ? entry.value : acc[entry.key].min,
      value: acc[entry.key].value + entry.value,
      count: acc[entry.key].count + 1
    } : {
      min: entry.value,
      max: entry.value,
      value: entry.value,
      count: 1
    }


    return i < arr.length - 1 ? acc : Object.keys(acc).map(key => {
      return {
        name: key,
        count: acc[key].count,
        min: acc[key].min,
        max: acc[key].max,
        average: acc[key].value / acc[key].count
      }
    })
  }

  #observerCallback(items) {
    this.entries.push(items.getEntries().map(entry => entry.toJSON()))
  }

  #computeMarkUnits(entries) {
    return entries.filter(entry => ['mark','measure'].includes(entry.entryType))
      .reduce((acc, entry) => {
        acc[entry.name] = entry.entryType === 'measure' ?
          'ms' : (entry.detail?.unit?.trim() || '')

        return acc
      }, {})
  }

  #computeMarkColors(entries) {
    return entries.filter(entry => ['mark','measure'].includes(entry.entryType))
      .reduce((acc, entry) => {
        acc[entry.name] = entry.entryType === 'measure' ? 'blue' : 'cyan'

        return acc
      }, {})
  }

  #onEventLoopEnd() {
    return new Promise(resolve => setImmediate(() => resolve()))
  }

  #throwIfRunning() {
    if (!this.#ended)
      throw new errors.RunNotEndedError()
  }
}

export { PerformanceRunner }
