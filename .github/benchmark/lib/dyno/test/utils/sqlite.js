import { unlinkSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const path = './test/temp/db.sqlite'
const database = new DatabaseSync('./test/temp/db.sqlite')

const insertDBRow = (pid, random_id, random_num = Math.random()) => {
  const database = new DatabaseSync(path)
  const s = 'INSERT INTO threads (pid, random_id, random_num) VALUES (?, ?, ?)'

  try {
      const insert = database.prepare(s)
      insert.run(pid, random_id, random_num)
    } catch (err) {
      // ignore DB locked complaints
      if (err.errcode !== 5)
        throw new Error(err)
    }
}

const selectDBRows = randomId => {
  const database = new DatabaseSync(path)
  const s = `SELECT * FROM threads WHERE random_id = "${randomId}"`
  const query = database.prepare(s)

  return query.all()
}

const resetDB = () => {
  unlinkSync(path)

  const database = new DatabaseSync(path)

  database.exec(`
    CREATE TABLE IF NOT EXISTS threads (
     	pid INTEGER,
     	random_id TEXT,
     	random_num INTEGER
    );
  `)
}

export { resetDB, selectDBRows, insertDBRow }
