import Plot from './src/plot.js'
import asciichart from 'asciichart'

class TaskPlot extends Plot {
  compute() {
    const randomColor = (_, i) => this.colors[i % this.colors.length]
    const colorLabel = (lbl, i) => asciichart.colored(lbl, randomColor(null, i))
    const fieldAsKey = field => field[0]
    const fieldAsHeader = field => field[1] || field[0]
    const rows = Object.values(this.rows)
      .map(thread => Object.keys(thread)
        .filter(key => this.fields.labels.plotted.map(fieldAsKey).includes(key))
          .map(key => Object.values(thread[key])
            .map(row => row.mean)))

    this.plots = rows.map(row => this.plot(row, {
      title: 'Task timings (mean/ms)',
      colors: this.fields.labels.plotted.map(fieldAsHeader).map(randomColor),
      labels: this.fields.labels.plotted.map(fieldAsHeader).map(colorLabel),
      height: 15
    }))
  }

  render() {
    this.plots ? console.log(this.plots[0]) : 0
    this.plots = null
  }
}

export default TaskPlot
