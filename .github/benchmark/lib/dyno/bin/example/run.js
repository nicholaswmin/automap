import { join } from 'node:path'
import { dyno, Table } from '{{entrypath}}'

await dyno({
  // location of task file
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    // required test parameters
    CYCLES_PER_SECOND: 10, 
    CONCURRENCY: 4, 
    DURATION_MS: 5 * 1000,
    
    // custom parameters,
    // passed on to 'task.js'
    FIB_NUMBER: 35,
    ITERATIONS: 3
  },

  render: function(threads) {
    // `threads` contains: 
    // - histograms & snapshots 
    //   of the histograms, per task, per thread
    
    // We'll log output in table format
    const pid  = process.pid.toString()
    
    // Primary output: 
    // Logs generic test information, 
    // cycles sent/finished etc..
    // 
    // available measures:
    // - 'sent', number of issued cycles 
    // - 'done', number of completed cycles 
    // - 'backlog', backlog of issued yet uncompleted cycles
    // - 'uptime', current test duration
    const main = threads[pid]
      const views = [
        new Table('Tasks')
        .setHeading('sent', 'done', 'backlog', 'uptime (secs)')
        .addRowMatrix([
          [
            main.sent?.count                    || 'n/a',
            main.done?.count                    || 'n/a',
            main.sent?.count - main.done?.count || 0,
            main.uptime?.count                  || 'n/a'
          ]
        ]),
        
        // Task/Thread output:
        // Per thread, logs custom measurements from 'task.js'
        new Table('Threads')
          .setHeading(
            'thread id', 
            'task (ms)', 
            'fibonacci (ms)'
          ).addRowMatrix(
        
        // - 'task' is provided by default
        // - 'fibonacci' is a custom measurement 
        //    taken using `performance.timerify`
        // 
        // Custom measurements can be taken in `task.js` via:
        // - `performance.timerify(fn)`
        // - `performance.measure('foo', mark1, mark2)`
        // 
        // Read more: https://nodejs.org/api/perf_hooks.html
        Object.keys(threads)
        .filter(_pid => _pid !== pid)
        .map(pid => {
          return [
            pid,
            Math.round(threads[pid]['task']?.mean)       || 'n/a',
            Math.round(threads[pid]['fibonacci']?.mean)  || 'n/a'
          ]
      })
      // sort `threads` by mean 'task' duration
      .sort((a, b) => b[1] - a[1])
       // show only the top 5 threads
      .slice(0, 5))
    ]
      
    // render the tables
    console.clear()
    views.forEach(view => console.log(view.toString()))  
  }
})
