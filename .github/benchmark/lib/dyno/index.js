import { styleText } from 'node:util'
import StatsObserver from './src/stats/stats-observer.js'
import configure from './src/configure.js'
import thread from './src/thread.js'

import Firehose from './src/firehose.js'
import Foreman from './src/foreman.js'
import TestTimer from './src/test-timer.js'

class Dyno {
  constructor({
    task,
    parameters,
    fields,
    before = async () => {},
    after = async () => {}
  }) {
    this.task = typeof task === 'string' && task.length && task.endsWith('.js')
      ? task
      : (() => { throw new Error('task must be a valid .js filepath') })()

    this.parameters = parameters
    this.fields = fields
    this.hooks = { before, after }
    this.stopping = false
    this.foreman = new Foreman(this.task, {
      count: this.parameters.THREAD_COUNT,
      parameters: this.parameters
    })

    this.firehose = new Firehose({
      tasksPerSecond: this.parameters.TASKS_SECOND
    })

    this.testTimer = new TestTimer({
      seconds: this.parameters.DURATION_SECONDS
    })

    this.observer = new StatsObserver({
      extraFields: {
        parameters: this.parameters
      },
      fields: this.fields
    })

    this.log = {
      success: message => console.warn(styleText(['green'], message)),
      error: message => console.warn(styleText(['red'], message)),
      warn: message => console.warn(styleText(['yellow'], message)),
      info: message => console.info(styleText(['blueBright'], message)),
      log: message => console.log(styleText(['normal'], message))
    }
  }

  async start() {
    process.once('SIGTERM', this.#onSIGTERM.bind(this))
    process.once('SIGINT', this.#onSIGINT.bind(this))
    this.foreman.once('exit', this.#onThreadExit.bind(this))

    const threads = await this.foreman.start()

    await this.#runBeforeHooks()

    this.firehose.start(threads)
    this.observer.start(threads)

    await this.testTimer.start()
    await this.stop(0)
    await this.log.success('test timer elapsed: success')

    return true
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

    await this.firehose.stop()
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

  #onThreadExit({ pid, code, signal }) {
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
    await this.hooks.before()
  }

  async #runAfterHooks() {
    await this.hooks.after()
  }
}

export { configure, Dyno, thread }
