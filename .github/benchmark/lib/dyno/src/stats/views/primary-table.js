import Table from './src/table.js'

class PrimaryTable extends Table {
  compute() {
    this.stats = [
      this.fields.reduce((acc, field) => {
        const split = field[0].split('.')
        const mapped = field[2]
          ? this.rows[split[0]]
            ? field[2](this.rows[split[0]] .at(-1)[split[1]])
            : 'no data'
          : this.rows[split[0]]
            ? this.rows[split[0]].at(-1)[split[1]]
            : 'no data'

        return {
          ...acc,
          [field[1]]: mapped
        }
      }, {})
    ]
  }

  render() {
    this.stats ? console.table(this.stats) : 0
    this.stats = null
  }
}

export default PrimaryTable
