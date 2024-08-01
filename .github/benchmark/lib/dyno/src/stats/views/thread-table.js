import Table from './src/table.js'

class ThreadTable extends Table {
  compute() {
    this.hiddenCount = Object.keys(this.rows).length - this.maxRows > 0
      ? Object.keys(this.rows).length - this.maxRows
      : 0

    this.threads = Object.keys(this.rows).map(pid => {
      return {
        thread: pid,
        ...this.fields.tabular.reduce((acc, field) => {
          const split = field[0].split('.')
          const rows = this.rows[pid][split[0]]
          const mapped = rows
            ? field[2]
              ? field[2](rows.at(-1)[split[1]])
              : rows.at(-1)[split[1]]
            : 'no data'

          return {
            ...acc,
            [field[0]]: {
              human_readable: field[1],
              value: mapped
            }
          }
        }, {})
      }
    })
    .sort((a, b) =>  b[this.fields.sortby].value - a[this.fields.sortby].value)
    .map(row => Object.keys(row).reduce((acc, key) => ({
      ...acc,
      [row[key].human_readable || key]: row[key].value || row[key]
    }), {}))
    .slice(0, this.maxRows)
  }

  render() {
    this.threads ? console.table(this.threads) : 0
    this.hiddenCount ? console.log(`... + ${this.hiddenCount} hidden rows`) : 0

    this.hiddenCount = 0
    this.threads = []
  }
}

export default ThreadTable
