import { validatePositiveInteger } from './validators.js'
import histogram from '../histogram/index.js'

class Scheduler {
  constructor({ cyclesPerSecond }) {
    this.on = true
    this.timer = null
    this.cyclesPerSecond = this.#validateRate(cyclesPerSecond)
    this.listeners = []
  }
  
  start(threads) {
    this.#throwIfRunning()
    this.#addTaskDoneListeners(threads)

    this.timer = setInterval(
      this.#scheduleOnRandom.bind(this, threads),
        Math.round(1000 / this.cyclesPerSecond)
    )
  }
  
  stop() {
    this.#throwIfStopped()

    this.on = false
    this.#stopTaskScheduling()
    this.#removeTaskDoneListeners()
    process.stop()
  }
  
  #stopTaskScheduling() {
    clearInterval(this.timer)
    this.timer = null
  }

  #addTaskDoneListeners(threads) {
    Object.values(threads).forEach(thread => {
      const listener = {
        thread: thread,
        handler: function measureDone({ name }) {
          if (['task:done'].includes(name))
            histogram('done').record(1)
        }
      }

      thread.on('message', listener.handler)
      this.listeners.push(listener)
    })
  }

  #removeTaskDoneListeners() {
    this.listeners.forEach(listener => 
      listener.thread.off('message', listener.handler))
    
    this.listeners = []
  }
  
  #scheduleOnRandom(threads) {
    // - If calculated `interval < 1ms`, which is the minimum possible 
    //   `setInterval()` duration, we create additional synthetic/filler 
    //    `process.send` calls to match the desired send cycle rate.
    //
    // - If calculated `interval < 1ms`, which is the minimum possible 
    //   `setInterval()` duration, we create additional synthetic/filler 
    //    `process.send` calls to match the desired send cyclesPerSecond.
    // @WARNING: 
    // - If `cyclesPerSecond > 1000`, it has to be set as multiples of `1000`, 
    //   otherwise `fillerCycles` won't be able to correctly fill the remainder.       
    const fracInterval = 1000 / this.cyclesPerSecond
    const fillerCycles = Math.ceil(1 / fracInterval)
  
    for (let i = 0; i < fillerCycles; i++) {
      const _threads = Object.values(threads)
      const random = _threads[Math.floor(Math.random() * _threads.length)]
  
      random && random.connected && this.on
        ? random.send({ name: 'task:start' }) 
          ? histogram('sent').record(1)
          : (() => {
            throw new Error('IPC oversaturated. Set "cyclesPerSecond" lower')
          })
        : false
    }
  }
  
  #throwIfStopped() {
    if (!this.on)
      throw new TypeError('Scheduler is already stopped')
  }
  
  #throwIfRunning() {
    if (this.timer)
      throw new TypeError('Scheduler is already running')
  }
  
  #validateRate(arg) {
    validatePositiveInteger(arg, 'cyclesPerSecond')

    if (arg > 10000)
      throw new RangeError(`"cyclesPerSecond" must be <= 10000, is: ${arg}`)

    if (arg > 1000 && arg % 1000 > 0)
      throw new RangeError(
        `"cyclesPerSecond" must be multiples of 1000 when > 1000, got: ${arg}`
      )
    
    return arg
  }
}

export default Scheduler
