import throttle from 'throttleit'
import localbus from './local-bus.js'

class StatsObserver {
  constructor(ctx, renderFn) {
    this.bufferSize = 100
    this.maxFPS = 30
    this.maxRate = Math.round(1000 / this.maxFPS)

    this.rows = { runner: {}, threads: {} }
    this.renderThrottled = throttle(renderFn.bind(ctx, this.rows), this.maxRate)
  }

  start(threads) {
    localbus.on('stats:row:update', row => {
      Object.keys(row).forEach(key => {
        this.rows.runner[key] = this.rows.runner[key] || []
        this.rows.runner[key].push(row[key])
        this.rows.runner[key].length >= this.bufferSize
          ? this.rows.runner[key].slice(1, this.rows.runner[key].length)
          : null
      })

      this.renderThrottled()
    })

    Object.values(threads).forEach(thread => {
      const pid = thread.pid

      thread.on('message', ({ type, row }) => {
        if (type !== 'stats:row:update')
          return

        Object.keys(row).forEach(key => {
          this.rows.threads[pid] = this.rows.threads[pid] || {}
          this.rows.threads[pid][key] = this.rows.threads[pid][key] || []
          this.rows.threads[pid][key].push(row[key])

          this.rows.threads[pid][key].length >= this.bufferSize
            ? this.rows.threads[pid][key].splice(1, 1) // keep the 1st
            : null
        })
        
        this.renderThrottled()
      })
    })
  }

  stop() {
    localbus.removeAllListeners('stats:row:update')
  }

  getRows() {
    return this.rows
  }
}

export default StatsObserver
