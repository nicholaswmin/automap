import Table from './src/table.js'

class TaskTable extends Table {
  compute() {
    this.threads = Object.keys(this.fields).map(key => {
      const sortby = this.fields[key].sortby || 'thread'
      const threads = Object.keys(this.rows)
      const start = threads.length - this.maxRows
      const end = threads.length

      this.excluded = Math.abs(start)

      return threads.slice(start, end).map(pid => {
        return {
          thread: pid,
          ...this.fields[key].labels.logged.reduce((acc, field) => {
            const split = field[0].split('.')
            const rows = this.rows[pid][split[0]]
            const mapped = rows
              ? field[2]
                ? field[2](rows.at(-1)[split[1]])
                : rows.at(-1)[split[1]]
              : 'no data'

            return {
              ...acc,
              [field[1]]: mapped
            }
          }, {})
        }
      }).sort((a, b) => +b[sortby] - +a[sortby])
    })
  }

  render() {
    this.threads ? this.threads.forEach(thread => console.table(thread)) : 0
    this.excluded ? console.log(`.. + ${this.excluded} hidden threads`) : 0
    this.threads = null
  }
}

export default TaskTable
