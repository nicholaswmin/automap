import throttle from 'throttleit'
import localbus from './local-bus.js'
import views from './views/index.js'

class StatsObserver {
  constructor({ fields = null, additionalRows } = {}) {
    this.bufferSize = 100
    this.renderThrottled = throttle(this.render.bind(this), 100)
    this.fields = fields || { general: {}, runner: [], threads: {} }
    this.rows = { runner: {}, threads: {} }
    this.views = views(this.rows, this.fields, additionalRows)
    this.stopped = false
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
      })
    })
  }

  render() {
    if (process.argv.some(a => a.includes('no-render')))
      return false

    if (this.stopped || ['test'].includes(process.env.NODE_ENV?.toLowerCase()))
      return false
    
    this.views.parameters.compute()
    this.views.runner.compute()
    this.views.tables.forEach(view => view.compute())
    this.views.plots.forEach(view => view.compute())

    console.clear()

    console.log('\n','Parameters')
    this.views.parameters.render()
    console.log('\n','Runner stats')
    this.views.runner.render()
    console.log('\n','Thread stats')
    this.views.tables.forEach(view => view.render())

    console.log('\n')

    this.views.plots.forEach(view => view.render())

    console.log('\n')
  }

  stop() {
    localbus.removeAllListeners('stats:row:update')
    this.stopped = true
  }

  getRows() {
    return this.rows
  }
}

export default StatsObserver
