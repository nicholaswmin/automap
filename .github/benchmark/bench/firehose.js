import { PrimaryStatsTracker } from './stats/stats-tracker.js'
import { Timer, TimeoutTimer } from './timers.js'

class Firehose {
  constructor({ tasksPerSecond }) {
    this.stats = new PrimaryStatsTracker(['sent', 'replies', 'memory'])
    this.tasksPerSecond = tasksPerSecond > 0 ? tasksPerSecond : (() => {
      throw new RangeError(`Must be an int > 0. Got: ${tasksPerSecond}`)
    })()

    this.counter = 0
    this.workers = []

    this.warmupSeconds = 5
    this.droppedRandomFactor = 0.90
    this.isWarmingUp = true

    this.timers = [
      new Timer(this.sendToRandom.bind(this), 1000 / tasksPerSecond),
      new TimeoutTimer(() => {
        this.isWarmingUp = false
      }, this.warmupSeconds * 1000)
    ]
  }

  start(workers) {
    this.workers = workers

    Object.values(workers).forEach(worker => {
      worker.on('message', message => {
        if (message.type !== 'ack')
          return null

        this.stats.replies.tick()
        this.stats.memory.record(process.memoryUsage().heapUsed)
        this.stats.publish()
      })
    })

    this.timers.forEach(timer => timer.start())
  }

  stop() {
    this.timers.forEach(timer => timer.stop())

    return new Promise(resolve => setImmediate(resolve))
  }

  sendToRandom() {
    const interval = Math.round(1000 / this.tasksPerSecond)
    const cycles = interval < 1 ? 1 / interval : 1

    for (let i = 0; i < cycles; i++) {
      const workers = Object.values(this.workers)
      const randomWorker = workers[Math.floor(Math.random() * workers.length)]

      if (this.isWarmingUp && Math.random() < this.droppedRandomFactor)
        return false

      randomWorker.send({ type: 'task:execute', task: ++this.counter })

      this.stats.sent.tick()
    }
  }
}

export default Firehose
