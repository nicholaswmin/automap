import { styleText } from 'node:util'

import StatsObserver from './src/stats/stats-observer.js'
import TestTimer from './src/test-timer.js'
import Firehose from './src/firehose.js'
import Foreman from './src/foreman.js'
import prompt from './src/prompt.js'
import Table from './src/views/table.js'
import Plot from './src/views/plot.js'
import task from './src/task.js'

class Dyno {
  constructor({
    task,
    parameters,
    render = async () => {},
    before = async () => {},
    after = async () => {}
  }) {
    this._parameters = parameters
    this.parameters = null
    this.stopping = false
    this.hooks = { before, after }

    this.foreman = new Foreman(task)
    this.firehose = new Firehose()
    this.testTimer = new TestTimer()
    this.observer = new StatsObserver(this, render)

    this.log = {
      success: message => process.env.NODE_ENV === 'test' ||
        console.info(styleText(['green'], message)),
      info: message => process.env.NODE_ENV === 'test' ||
        console.info(styleText(['blueBright'], message)),
      error: message => console.error(styleText(['red'], message)),
      warn: message => console.warn(styleText(['yellow'], message))
    }
  }

  async start() {
    this.log.info('starting up ...')
    this.parameters = this.#validateKeys(await prompt(this._parameters), [
      {  key: 'TASKS_SECOND', type: 'number', min: 1, max: 9999 },
      {  key: 'TEST_SECONDS', type: 'number', min: 1, max: 9999 },
      {  key: 'THREAD_COUNT', type: 'number', min: 1, max: 1000 }
    ])

    process.once('SIGTERM', this.#onSIGTERM.bind(this))
    process.once('SIGINT', this.#onSIGINT.bind(this))

    this.foreman.once('exit', this.#onThreadExit.bind(this))

    const threads = await this.foreman.start({ 
      count: this.parameters.THREAD_COUNT,
      parameters: this.parameters
    })

    await this.#runBeforeHooks()

    this.firehose.start({ threads, tasksSecond: this.parameters.TASKS_SECOND })
    this.observer.start(threads)

    await this.testTimer.start(this.parameters.TEST_SECONDS)
    await this.stop(0)

    this.log.success('test timer elapsed: success')

    return this.observer.getRows()
  }

  async stop(code = 0) {
    console.log('\n')

    if (this.stopping)
      this.log.warn('process already stopping')

    this.stopping = true

    this.log.info('shutting down ...')
    
    this.observer.stop()
    this.log.info('stats observer stopped ...')

    await this.foreman.stop()
    this.log.info('threads shutdown ...')

    this.firehose.stop()
    this.log.info('firehose stopped ...')

    await this.testTimer.stop()
    this.log.info('test timer stopped ...')

    await this.#runAfterHooks()
    this.log.info('run after hooks ...')

    this.stopping = false

    code === 0
      ? this.log.success(`exiting with code: ${code}`)
      : this.log.error(`exiting with code: ${code}`)
  }

  #onThreadExit({ pid, code }) {
    if (code === 0)
      return false

    this.log.error(`thread: ${pid} exited with code: ${code}`)

    return this.stop(code)
  }

  #onSIGTERM() {
    this.log.info('received signal: SIGTERM')
    this.stop(0)
  }

  #onSIGINT() {
    this.log.info('received signal: SIGINT')
    this.stop(0)
  }

  async #runBeforeHooks() {
    await this.hooks.before(this.parameters)
  }

  async #runAfterHooks() {
    await this.hooks.after(this.parameters)
  }
  
  #validateKeys(obj, required) {
    required.forEach(req => {
      if (!Object.hasOwn(obj, req.key))
        throw new TypeError(`required key: ${req.key} not found`)
      
      const k = req.key, v = obj[req.key], t = typeof obj[req.key]
      
      if (req.type !== t)
        throw new TypeError(`expected: ${k} to be a: ${req.type}, got: ${t}`)

      if (req.type === 'number')
        if (!Number.isInteger(v))
          throw new TypeError(`expected: ${k} to be an integer, got: ${t}`)
      
      if ((req.min || req.min === 0) && v < req.min)
        throw new RangeError(`${k}: ${v} is below min range of: ${req.min}`)
      
      if ((req.max || req.max === 0) && v > req.max)
        throw new RangeError(`${k}: ${v} is above max range of: ${req.max}`)
    })
    
    return obj
  }
}

export { Dyno, Plot, Table, task }
