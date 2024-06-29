import { createHistogram } from 'node:perf_hooks'

import utils from './utils.js'

class Task {
  constructor({ id = utils.randomID(), name, cycles, fn }) {
    this.id = id
    this.name = this.#validateStringWithLength(name, 'name')
    this.cycles = this.#validatePositiveInt(cycles, 'cycles')
    this.memUsages = []

    this.histogram = createHistogram()
    this.timerifiedFn = performance.timerify(
      this.#validateFunction(fn, 'fn'),
      { histogram: this.histogram })
  }

  async run(i = null) {
    i = i === null ? 0 : i

    await this.timerifiedFn({ cycle: i + 1, taskname: this.name })

    this.#tickLoader(this.name, i)
    this.memUsages.push(process.memoryUsage())

    return i === this.cycles - 1 ? this.memUsages : await this.run(++i)
  }

  #tickLoader(name, i) {
    if (process.env.NODE_ENV === 'test')
      return


    if (i === 0 || i % 5 === 0) {
      console.clear()
      console.log('--', 'Running:', name, i, '--')
    }
  }

  #validateStringWithLength(str, name) {
    if (typeof str !== 'string' || !str.length)
      throw new Error(`Expected ${name} to be a string with length`)

    return str
  }

  #validatePositiveInt(num, name) {
    if (isNaN(num) || num < 1)
      throw new Error(`Expected ${name} to be a positive integer`)

    return num
  }

  #validateFunction(func, name) {
    if (typeof func !== 'function')
      throw new Error(`Expected ${name} to be a function`)

    return func
  }
}

export default Task
