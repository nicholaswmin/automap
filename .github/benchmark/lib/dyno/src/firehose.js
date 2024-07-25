import { PrimaryStatsTracker } from './stats/stats-tracker.js'
import { Timer, TimeoutTimer } from './timers.js'

class Firehose {
  constructor({ tasksPerSecond }) {
    this.stats = new PrimaryStatsTracker(['sent', 'replies', 'memory'])
    this.tasksPerSecond = tasksPerSecond > 0 ? tasksPerSecond : (() => {
      throw new RangeError(`Must be an int > 0. Got: ${tasksPerSecond}`)
    })()

    this.counter = 0
    this.threads = []

    this.warmupSeconds = 5
    this.droppedRandomizationFactor = 0.90
    this.isWarmingUp = true

    this.timers = [
      new Timer(this.sendToRandom.bind(this), 1000 / tasksPerSecond),
      new TimeoutTimer(() => {
        this.isWarmingUp = false
      }, this.warmupSeconds * 1000)
    ]
  }

  start(threads) {
    this.threads = threads

    Object.values(threads).forEach(thread => {
      thread.on('message', message => {
        if (message.type === 'ack') {
          this.stats.replies.tick()
          this.stats.memory.record(process.memoryUsage().heapUsed)
          this.stats.publish()
        }
      })
    })

    this.timers.forEach(timer => timer.start())
  }

  stop() {
    const interval = Math.round(1000 / this.tasksPerSecond)
    const waitForDrain = 1000 + interval

    this.timers.forEach(timer => timer.stop())
    return new Promise(resolve => setTimeout(resolve, waitForDrain))
  }

  sendToRandom() {
    const interval = Math.round(1000 / this.tasksPerSecond)
    const cycles = interval < 1 ? 1 / interval : 1

    for (let i = 0; i < cycles; i++) {
      const threads = Object.values(this.threads)
      const random = threads[Math.floor(Math.random() * threads.length)]

      this.isWarmingUp && Math.random() < this.droppedRandomizationFactor
        ? null
        : random.connected
          ? random.send({
            type: 'task:execute',
            task: this.stats.sent.count + 1
          }, null, { keepOpen: true })
          : null

      this.stats.sent.tick()
    }
  }
}

export default Firehose
