import { EventEmitter } from 'node:events'
import { round, nanoToMs, toMB } from '../../../test/helpers/utils/index.js'
import { monitorEventLoopDelay, createHistogram } from 'node:perf_hooks'
import primary from './primary.js'
import worker from './worker.js'

// Performance

class TaskPerformanceEntry {
  constructor({
    startTime = null,
    duration = null,
    entries = []
  } = {}) {
    this.startTime = startTime
    this.duration = duration
    this.entries = entries
  }

  addEntries(entries) {
    const isEndingEntry  = entry => entry.name === 'task-end'
    const notEndingEntry = entry => !isEndingEntry(entry)
    const endingEntry = entries.find(isEndingEntry)

    this.entries = [
      ...this.entries,
      ...entries.filter(notEndingEntry)
    ]

    if (endingEntry) {
      this.name = endingEntry.detail
      this.startTime = endingEntry.startTime
      this.duration = endingEntry.duration
    }

    return this
  }

  hasEnded() {
    return this.duration !== null
  }

  isRunning() {
    return !this.hasEnded()
  }

  toMs() {
    const toJSON = entry => entry.toJSON ? entry.toJSON() : entry

    return [
      {
        'name': 'task',
        'thread': process.pid,
        'duration (ms)': round(this.duration)
      },
      ...this.entries.map(toJSON)
        .map(entry => ({
          'name': entry.name,
          'duration (ms)': round(entry.duration)
        }))
    ]
  }

  log() {
    console.log(this.toMs())

    return this
  }
}

class TaskPerformanceTracker extends EventEmitter {
  #maxTaskEntriesLimit = 200

  constructor({ constants = {} }) {
    super()

    this.pid = process.pid.toString()
    this.constants = this.#validateConstants(constants)

    this.histograms =  {
      memory: createHistogram(),
      loop: monitorEventLoopDelay(),
      backlog: createHistogram(),
      tasks: createHistogram()
    }

    this.performance = {
      current: null,
      taskEntries: [],
      histograms: {
        task: createHistogram(),
        fn: {}
      }
    }

    this.state = {
      started: false,
      stopped: false,
      running: false,
      finished: false
    }

    this.backlog = []
    this.taskFn = null

    this.stats = {
      tasksRun: 0,
      maxBacklog: 0,
      maxMem: null
    }

    this.observer = new PerformanceObserver(list => {
      this.performance.current = this.performance.current?.isRunning()
        ? this.performance.current
        : new TaskPerformanceEntry()

      this.performance.current.addEntries(list.getEntries())

      if (this.performance.taskEntries.length > this.#maxTaskEntriesLimit)
        this.performance.taskEntries = []

      this.performance.current.hasEnded() ?
        this.performance.taskEntries.push(this.performance.current) :
        null


      const taskEnd = list.getEntriesByName('task-end').pop()

      this.performance.histograms.task.record(Math.ceil(taskEnd?.duration) || 1)
    })

    this.observer.observe({ entryTypes: ['measure', 'function'] })
  }

  async enqueue(task) {
    if (this.state.stopped)
      return null

    if (!this.state.started)
      throw new Error('tracker has not started yet')

    if (this.state.finished) {
      this.state.running = false
      this.#end()
      return this.emit('finish', this.toJSON())
    }

    if (this.backlog.length >= this.constants.MAX_WORKER_BACKLOG)
      this.state.finished = new Date()

    if (this.state.running)
      return this.backlog.push(task)

    this.state.running = true

    performance.mark('t-0')

    try {
      await this.taskFn(task)
    } catch (err) {
      console.error(err)
      process.exit(1)
    }

    this.#updateHistograms()

    performance.mark('t-1')
    performance.measure('task-end', {
      detail: task.detail, start: 't-0', end: 't-1'
    })

    this.state.running = false

    return this.backlog.length ? this.enqueue(this.backlog.pop()) : true
  }

  start(taskFn) {
    if (this.state.started)
      throw new Error('tracker already started')

    if (this.state.finished)
      throw new Error('tracker has finished')

    this.observer.observe({ entryTypes: ['measure', 'function'] })
    this.histograms.loop.enable()

    this.taskFn = taskFn
    this.state.started = new Date()

    return this
  }

  stop() {
    this.#end()

    this.state.stopped = new Date()

    return this.backlog.length || this.state.running
      ? new Promise(resolve => {
        const timer = setTimeout(() => {
          this.off('task:run', resolve)
          resolve()
        }, 1000)

        this.once('task:run', () => {
          clearTimeout(timer)
          resolve()
        })
      })
      : Promise.resolve()
  }

  #end() {
    this.observer.disconnect()
    this.histograms.loop.disable()
  }

  timerify(func) {
    const histogram = createHistogram()

    this.performance.histograms.fn[func.name] = histogram

    return performance.timerify(func, { histogram })
  }

  #updateHistograms() {
    this.histograms.memory.record(process.memoryUsage().heapUsed || 1 )
    this.histograms.backlog.record(this.backlog.length || 1)
    this.histograms.tasks.record(1)

    this.emit('task:run', this.toRow())
  }

  #histogramRow(histogram, convert = value => value) {
    const min = convert(histogram.min)
    const mean = convert(histogram.mean)
    const max = convert(histogram.max)

    return `mean: ${mean}, max: ${max}`
  }

  #validateConstants(constants) {
    Object.entries(constants).forEach(([key, val]) => {
      if (!val)
        throw new Error(`${key} is a falsy value`)

      if (typeof val === 'string') {
        if (!val.includes('://'))
          throw new Error(`${key} is non-URL string`)

        return
      }

      if (isNaN(val) || val === 0)
        throw new Error(`${key} is not a valid number`)
    })

    return constants
  }

  toJSON() {
    return this
  }

  toRow() {
    return {
      'pid': this.pid,
      'cycles': this.histograms.tasks.count,
      'max backlog': this.histograms.backlog.max,
      'mean mem (mb)': toMB(this.histograms.memory.mean),
      'max mem (mb)': toMB(this.histograms.memory.max),
      'evt loop mean (ms)': nanoToMs(this.histograms.loop.mean),
      ...Object.entries(this.performance.histograms.fn).reduce((acc, entry) => {
        const name = entry[0].replace('bound ', 'fn:') + ' mean (ms)'
        const hgram = entry[1]

        return {
          ...acc,
          [name]: nanoToMs(hgram.mean)
        }
      }, {
        'task mean (ms)': round(this.performance.histograms.task.mean)
      })
    }
  }
}

export {
  TaskPerformanceTracker,
  primary,
  worker
}
