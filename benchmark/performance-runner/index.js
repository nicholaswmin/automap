import { createHistogram, monitorEventLoopDelay } from 'node:perf_hooks'
import { styleText as style } from 'node:util'
import { Table, printTable } from 'console-table-printer'

import histograms from './src/histograms.js'
import timeline from './src/timeline.js'
import errors from './src/errors.js'
import utils from './src/utils.js'

class Task {
  constructor({ id = utils.randomID(), name, cycles, fn }) {
    this.id = id
    this.name = name
    this.cycles = cycles

    this.histogram = createHistogram()
    this.timerifiedFn = performance.timerify(fn, { histogram: this.histogram })
  }

  async run(i) {
    return await this.timerifiedFn({ cycle: i + 1, taskname: this.name })
  }
}

class PerformanceRunner {
  #state

  constructor() {
    this.tasks = []
    this.entries = []
    this.#state = 'ready'

    this.loopHistogram = new monitorEventLoopDelay({ resolution: 10 })
    this.observer = new PerformanceObserver(this.#observerCallback.bind(this))
    this.entryTypes = PerformanceObserver.supportedEntryTypes
    this.observer.observe({ entryTypes: this.entryTypes })
  }

  async run(taskData = []) {
    this.#throwIfEnded()
    this.#throwIfRunning()

    this.tasks = taskData.map(task => new Task(task))
    this.#transitionState('running')
    this.loopHistogram.enable()

    for (let task of this.tasks)
      for (let i = 0; i < task.cycles; i++)
        await task.run(i)

    return this.#end()
  }

  printTimeline() {
    this.#throwIfNotEnded()

    const table = new Table({
      title: 'timeline',
      columns: [
        { name: 'type', alignment: 'right' },
        { name: 'name', alignment: 'right' },
        { name: 'value', alignment: 'left' }
      ]
    })

    table.addRows(timeline.computeHeaderRows({
      column: 'type',
      columns: ['type', 'name', 'value'],
      value: style(['white', 'bold', 'underline'], 'Startup')
    }))

    this.entries.forEach(entry => {
      const isTask = entry.detail &&
        entry.detail.length &&
        Object.hasOwn(entry.detail[0], 'taskname')

      return isTask ?
        timeline.addRowForCycle(table, entry) :
        table.addRow(timeline.toRowView(entry))
    })

    table.printTable()

    return this
  }

  printAggregates() {
    this.#throwIfNotEnded()

    const table = new Table({
      title: 'Histograms',
      columns: histograms.computeHistogramColumns()
    })

    histograms.addRowsForTasks(table, this.tasks)
    histograms.addRowsForMarks(table, this.entries)
    histograms.addRowsForMeasures(table, this.entries)
    histograms.addRowsForEntryType(table, this.entries, { entryType: 'gc' })
    histograms.addRowsForEntryType(table, this.entries, { entryType: 'dns' })
    histograms.addRowsForEntryType(table, this.entries, { entryType: 'net' })

    histograms.addRowsForHistogram(table, this.loopHistogram, {
      name: 'loop latency'
    })

    table.printTable()

    return this
  }

  async #end() {
    await this.#onEventLoopEnd()

    this.observer.disconnect()
    this.loopHistogram.disable()
    this.entries = this.entries.concat(this.observer.takeRecords()).flat()

    this.#transitionState('ended')
  }

  #observerCallback(items) {
    this.entries.push(items.getEntries().map(entry => entry.toJSON()))
  }

  #onEventLoopEnd() {
    return new Promise(resolve => setImmediate(() => resolve()))
  }

  #transitionState(state) {
    if (!['running', 'ended'].includes(state))
      throw new errors.InvalidStateError(state)

    this.#state = state

    return this
  }

  #throwIfNotEnded() {
    if (this.#state !== 'ended')
      throw new errors.NotEndedError()
  }

  #throwIfEnded() {
    if (this.#state === 'ended')
      throw new errors.AlreadyEndedError()
  }

  #throwIfRunning() {
    if (this.#state === 'running')
      throw new errors.StillRunningError()
  }
}

export { PerformanceRunner }
