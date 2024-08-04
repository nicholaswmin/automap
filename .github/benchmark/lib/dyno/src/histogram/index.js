import { Bus } from '../bus/index.js'
import Measurement from './measurement/index.js'

const histogram = name => {
  const bus = Bus()

  return {
    record: (value = 1) => bus.emit(new Measurement({ name, value })),
    stop: () => bus.stop()
  }
}

export default histogram
