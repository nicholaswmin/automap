import plot from './ascii-chart.js'

class CyclePlot {
  constructor({ entries = [], name = 'Plot' }) {
    this.name = name
    this.entries = entries
    this.colors = [92, 33, 34, 35, 36, 37].map(c => '\u001b[' + c + 'm')
    this.cycles = {}
    this.plot = null
    this.disabled = ['test'].includes(process.env.NODE_ENV)
  }

  get() {
    return this.plot
  }

  draw(i) {
    if (this.disabled)
      return this

    console.clear()
    console.log(this.plot)

    return this
  }

  async update(i) {
    const toIntDuration = entry => parseInt(entry.duration)
    const toTasknameTop = (a, b) => (b === this.name) - (a === this.name)
    const isPositive = value => value > 0
    const toLabel = (key, i) => {
      const taskLabel = i => `- ${!i ? 'main task' : 'fn:'}`
      const funcLabel = (key, i) => i ? key.replaceAll('bound ', '') : ''

      return `${taskLabel(i)}${funcLabel(key, i)}`
    }

    await this.#onEventLoopEnd()
    this.#updatePaddedCycles(i)

    const keys = Object.keys(this.cycles).sort(toTasknameTop)
    const durations = keys.map(key => this.cycles[key].map(toIntDuration))
    const lineLabels = keys.map(toLabel)

    if (!durations.flat().length)
      return this

    this.plot = plot(durations, {
      width: (process.stdout.columns || 200) / 2,
      height: (process.stdout.rows || 25) / 2.5,
      title: `task: "${this.name}"`,
      colors: keys.map((key, i) => this.colors[i % this.colors.length]),
      lineLabels: lineLabels,
      yLabel: 'durations (ms)',
      xLabel: 'cycles',
      time: 'millis'
    })

    return this
  }

  #updatePaddedCycles(i) {
    this.cycles = this.#getLastFunctionEntries()
      .reduce((cycles, fnEntry) => {
        const fnEntries = cycles[fnEntry.name]
        const lastEntry = fnEntries ? fnEntries.at(-1) : null

        return fnEntries ? {
          ...cycles,
          [fnEntry.name]: [
            ...fnEntries,
            lastEntry.startTime === fnEntry.startTime ?
              ({ ...lastEntry, duration: 0 }) : fnEntry
          ]
        } : {
          ...cycles,
          [fnEntry.name]: Array
            .from({ length: i })
            .fill({ startTime: 0, duration: 0 })
            .concat([ fnEntry ])
        }
      }, this.cycles)

    return this
  }

  #getLastFunctionEntries() {
    return this.entries.flat()
      .filter(entry => ['function'].includes(entry.entryType))
      .reduce((acc, fnEntry, i, arr) => {
        const name = fnEntry.name === 'fn' ?
          fnEntry.detail?.[0]?.taskname :
          fnEntry.name

        acc[fnEntry.name] = { ...fnEntry, name: name }

        return i === arr.length - 1 ? Object.values(acc) : acc
      }, [])
  }

  #onEventLoopEnd() {
    return new Promise(res => setImmediate(res))
  }
}

export default CyclePlot
