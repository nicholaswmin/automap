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
    this.parameters = await prompt(this._parameters)

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

    await this.testTimer.start(this.parameters.DURATION_SECONDS)
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

    await this.foreman.stop()
    this.log.info('threads shutdown ...')

    this.observer.stop()
    this.log.info('stats observer stopped ...')

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
}

export { Dyno, Plot, Table, task }
