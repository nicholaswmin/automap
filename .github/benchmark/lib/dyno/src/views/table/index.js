import { AsciiTable3 } from 'ascii-table3'

class Table {
  constructor(title, rows = []) {
    this.table = new AsciiTable3(title)
    this.rows = Array.isArray(rows) ? rows : [rows]
    this.values = this.rows.map(row => Object.values(row)
      .map(v => typeof v === 'undefined' || isNaN(v) ? 'n/a' : v))

    this.table
      .setHeading(...Object.keys(this.rows[0] || {}))
      .addRowMatrix(this.values)

    return this
  }
  
  render(shouldRender = true) {
    const output = this.rows.length 
      ? this.table.toString() 
      : 'no rows'
    
    if (shouldRender)
      console.log(output)
    
    return output
  }
}

export default Table
