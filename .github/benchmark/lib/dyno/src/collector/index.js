import { Bus } from '../bus/index.js'
import { ProcessMeasurement } from './process-measurement/index.js'

class Collector {
  constructor() {
    this.on = true
    this.bus = Bus()

    this.measurements = {}
  }
  
  start(threads, cb) {
    this.bus.listen(threads, measurement => {
      return this.on ? (() => {
        this.#record(measurement)
        cb(this.measurements) 
      })() : null
    })
  }
  
  stop() {
    this.on = false
    this.bus.stop()
  }
  
  #record({ pid, name, value }) {
    // @REVIEW, 
    // - `measurement` is not a good name for this, 
    //   too long to carry around in userland when building views

    if (!this.measurements[pid])
      return this.measurements[pid] = new ProcessMeasurement({ name, value })
    
    if (!this.measurements[pid][name])
      return this.measurements[pid].createTimeseriesHistogram({ name, value })

    this.measurements[pid][name].record(value)
  }
}

export default Collector
