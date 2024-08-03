import child_process from 'node:child_process'
import os from 'node:os'
import { EventEmitter } from 'node:events'

class Foreman extends EventEmitter {
  constructor(path) {
    super()

    this.path = typeof path === 'string' && path.length && path.endsWith('.js')
      ? path
      : (() => { throw new Error(`${path} is not a valid .js file path`) })()

    this.count = 1
    this.threads = {}
  }

  async start({ count = os.availableParallelism(), parameters = {} }) {
    this.count = count > 0 ? count : (() => {
      throw new RangeError(`"count" must be an integer > 0. Got: ${count}`)
    })()

    for (let i = 0; i < this.count; i++) {
      const thread = await this.#forkThread(this.path, parameters)
      this.threads[thread.pid] = thread
    }

    return this.threads
  }

  stop() {
    const deaths = Object.values(this.threads).map(thread => {
      return new Promise((resolve => {
        thread.once('exit', resolve)
        setImmediate(() => {
          return thread.connected
            ? thread.send({ type: 'shutdown' })
            : resolve()
        })
      }))
    })

    return Promise.all(deaths)
  }

  #forkThread(path, parameters) {
    const self = this

    return new Promise((resolve, reject) => {
      return child_process.fork(path, {
        env: { ...process.env, PARAMETERS: JSON.stringify(parameters) }
      })
      .once('spawn', function() { resolve(this) })
      .once('error', function(err) { reject(err) })
      .once('exit', function(code, signal) {
        self.emit('exit', ({ pid: this.pid, code, signal }))
      })
    })
  }
}

export default Foreman
