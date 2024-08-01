import asciichart from './asciichart.js'

const padRight = text => text ? ` ${text}` : ''
const linebreak = (count = 1) => '\n'.repeat(count)

class Plot {
  constructor(fields, rows) {
    this.rows = rows
    this.fields = fields
    this.height = 7
    this.colors = [
      '\x1b[32m', '\x1b[33m', '\x1b[34m', '\x1b[35m', '\x1b[95m',
      '\x1b[36m', '\x1b[36m', '\x1b[91m', '\x1b[92m', '\x1b[94m'
    ]
  }

  plot(arrays, config = {}) {
    const title = config.title || ''
    const legend = config.labels ? `Legend: ${config.labels.join(', ')}` : ''
    const plot = asciichart.plot(arrays, { ...config, padding: '       ' })

    return linebreak(1)
      + padRight(title)

      + linebreak(2)
      + padRight(legend)
      + linebreak(2)

      + plot
      + linebreak(2)
  }

  compute() {
    return this
  }

  render() {
    return this
  }
}

export default Plot
