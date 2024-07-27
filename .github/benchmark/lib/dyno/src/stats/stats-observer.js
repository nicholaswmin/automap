import throttle from 'throttleit'
import localbus from './local-bus.js'
import views from './views/index.js'

class StatsObserver {
  constructor({ fields = null, extraFields } = {}) {
    this.bufferSize = 100
    this.renderThrottled = throttle(this.render.bind(this), 100)
    this.extraFields = extraFields
    this.fields = fields || { general: {}, primary: [], threads: {} }
    this.rows = { primary: {}, threads: {} }
    this.views = views(this.rows, this.fields)
    this.stopped = process.env.NODE_ENV === 'test'
  }

  start(threads) {
    localbus.on('stats:row:update', row => {
      Object.keys(row).forEach(key => {
        this.rows.primary[key] = this.rows.primary[key] || []
        this.rows.primary[key].push(row[key])
        this.rows.primary[key].length >= this.bufferSize
          ? this.rows.primary[key].slice(1, this.rows.primary[key].length)
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
    if (this.stopped || ['test'].includes(process.env.NODE_ENV?.toLowerCase()))
      return false

    this.views.primary.compute()
    this.views.tables.forEach(view => view.compute())
    this.views.plots.forEach(view => view.compute())

    console.clear()

    this.views.primary.render()
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
