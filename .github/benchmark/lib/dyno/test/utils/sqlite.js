// test utility
// - the tests cannot access the task file itself directly, so the tasks create
//   some output in a SQLITE3 database which we then pickup in the tests
//   and assert against.
import { unlinkSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'

const path = './test/temp/db.sqlite'

const insertDBRow = async (pid, content = '', alt = '') => {
  // avoid concurrent inserts to avoid db locked issues
  await new Promise(resolve => setTimeout(resolve, 0))
  
  const database = new DatabaseSync(path)

  try {
    database
      .prepare('INSERT INTO lines (pid, content, alt) VALUES (?, ?, ?)')
      .run(pid, content, alt)
  } catch (err) {
    // ignore "DB locked" errors because of
    // concurrent access
    if (err.errcode !== 5)
      throw new Error(err)
  }
}

const selectDBRows = content => {
  const database = new DatabaseSync(path)

  return database
    .prepare(`SELECT * FROM lines WHERE content = "${content}"`)
    .all()
}

const resetDB = () => {
  try {
    unlinkSync(path)    
  } catch (err) {
    if (err.code === 'ENOENT')
      return 
    
    throw err
  }

  const database = new DatabaseSync(path)

  database.exec(`
    CREATE TABLE IF NOT EXISTS lines (
     	pid INTEGER,
     	content TEXT,
     	alt TEXT
    );
  `)
}

export { resetDB, selectDBRows, insertDBRow }
