
import { styleText as c } from 'node:util'
import StatsObserver from './src/stats/stats-observer.js'
import configure from './src/configure.js'
import thread from './src/thread.js'

import Firehose from './src/firehose.js'
import Foreman from './src/foreman.js'
import TestTimer from './src/test-timer.js'

class Dyno {
  constructor({
    path,
    parameters,
    fields,
    before = async () => {},
    after = async () => {}
  }) {
    this.path = typeof path === 'string' && path.length && path.endsWith('.js')
      ? path
      : (() => { throw new Error('path must be a valid .js filepath') })()

    this.parameters = parameters
    this.fields = fields
    this.hooks = { before, after }
    this.stopping = false
    this.foreman = new Foreman(this.path, {
      count: this.parameters.THREAD_COUNT,
      parameters: this.parameters
    })

    this.firehose = new Firehose({
      tasksPerSecond: this.parameters.TASKS_SECOND
    })

    this.testTimer = new TestTimer({
      durationSeconds: this.parameters.DURATION_SECONDS
    }, () => this.stop(0))

    this.observer = new StatsObserver({
      extraFields: {
        parameters: this.parameters
      },
      fields: this.fields
    })
  }

  async start() {
    process.once('SIGTERM', this.#onSIGTERM.bind(this))
    process.once('SIGINT', this.#onSIGINT.bind(this))
    this.foreman.once('exit', this.#onThreadExit.bind(this))

    const threads = await this.foreman.start()

    await this.#runBeforeHooks()

    this.firehose.start(threads)
    this.observer.start(threads)
    this.testTimer.start()
  }

  async stop(code = 0) {
    console.log('\n')

    if (this.stopping) {
      console.warn(c(['red'], 'WARN: process already stopping ...'))
    }

    this.stopping = true

    const timer = setTimeout(() => {
      console.log(c(['red'], 'graceful shutdown timed out. Force exiting ...'))
      return this.exit(1)
    }, 5 * 1000)

    console.log(c(['yellow'], 'shutting down ...'))

    this.observer.stop()
    console.log(c(['yellow'], 'stats observer stopped ...'))

    await this.firehose.stop()
    console.log(c(['yellow'], 'firehose stopped ...'))

    await this.testTimer.stop()
    console.log(c(['yellow'], 'test timer stopped ...'))

    await this.foreman.stop()
    console.log(c(['yellow'], 'threads gracefully shutdown ...'))

    await this.#runAfterHooks()
    console.log(c(['yellow'], 'after hooks run ...'))

    console.log(c(['yellow'], 'bye 👋'))

    clearTimeout(timer)

    this.stopping = false
  }

  #onThreadExit({ pid, code, signal }) {
    if (code === 0)
      return false

    console.log(
      c(['red'], `thread: ${pid} exited with code: ${code}`)
    )

    return this.stop(code)
  }

  #onSIGTERM() {
    console.log('\n')
    console.log(c(['yellow'], 'received signal: SIGTERM'))
    this.stop(0)
  }

  #onSIGINT() {
    console.log('\n')
    console.log(c(['yellow'], 'received signal: SIGINT'))
    this.stop(0)
  }

  #exit(code) {
    console.log(c([code !== 0 ? 'red' : 'green'], `exited with code: ${code}`))

    process.exit(code)
  }

  async #runBeforeHooks() {
    await this.hooks.before()
  }

  async #runAfterHooks() {
    await this.hooks.after()
  }
}

export { configure, Dyno, thread }
