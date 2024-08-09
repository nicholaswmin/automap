import test from 'node:test'
import path from 'node:path'
import util from 'node:util'
import child_process from 'node:child_process'
import fs from 'node:fs/promises'

const folderpaths = {
  test: path.join(import.meta.dirname, './temp/test'),
  benchmark: path.join(import.meta.dirname, './temp/test/benchmark')
}

const fileExists = filepath =>  fs.access(filepath)
  .then(() => true)
  .catch(() => false)

const exec = util.promisify(child_process.exec)

const execQuick = (cmd, { cwd }) => {
  const ctrl = new AbortController()

  return new Promise((resolve, reject) => {
    const res = child_process.exec(cmd, { cwd, signal: ctrl.signal })
    
    res.stderr.once('data', data => reject(new Error(data)))
    res.stdout.once('data', data => {
      resolve(data.toString())
      ctrl.abort()
    })
  })
}

test('npx init', async t => {
  t.before(async () => {
    await fs.rm(folderpaths.benchmark, { recursive: true, force: true })
    await exec('npx init', { cwd: folderpaths.test })
  })
  
  t.after(async () => {
    await fs.rm(folderpaths.benchmark, { recursive: true, force: true })
  })
    
  await t.test('creates a runnable example', async t => {
    await t.test('creates a benchmark folder', async t => {
      t.assert.ok(
        await fileExists(folderpaths.benchmark), 
        'cannot find /benchmark folder'
      )
    })
    
    await t.test('creates a run.js file', async t => {
      t.assert.ok(
        await fileExists(path.join(folderpaths.benchmark, 'run.js')), 
        'cannot find benchmark/run.js file'
      )
    })
    
    await t.test('creates a task.js file', async t => {
      t.assert.ok(
        await fileExists(path.join(folderpaths.benchmark, 'task.js')), 
        'cannot find benchmark/task.js file'
      )
    })
    
    await t.test('creates a README.md file', async t => {
      t.assert.ok(
        await fileExists(path.join(folderpaths.benchmark, 'README.md')), 
        'cannot find benchmark/README.md file'
      )
    })
    
    await t.test('runs the example', async t => {
      await t.test('running the example logs some output', async t => {
        const out = await execQuick('NODE_ENV=test node run.js', { 
          cwd: folderpaths.benchmark
        })
    
        t.assert.ok(out.includes('Tasks'))
      })
    })
  })
})
