import child_process from 'node:child_process'
import { EventEmitter } from 'node:events'

class Foreman extends EventEmitter {
  constructor(path, { count, parameters }) {
    super()

    this.path = path
    this.threads = {}
    this.parameters = JSON.stringify(parameters)
    this.count = count > 0 ? count : (() => {
      throw new RangeError(`Must be an int > 0. Got: ${count}`)
    })()
  }

  async start() {
    for (let i = 0; i < this.count; i++) {
      const thread = await this.#forkThread(this.path, this.parameters)
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
        env: {
          ...process.env,
          BY_PRIMARY: true, parameters
        }
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
