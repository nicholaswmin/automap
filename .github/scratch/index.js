// Run with: `node ./.github/scratch/index.js`
import Benchmrk from 'benchmrk'
import ioredis from 'ioredis'

import { Paper } from './paper/index.js'
import { Repository } from '../../index.js'
import { randomId, payloadKB } from '../../test/utils/utils.js'

const redis  = new ioredis()
const repo   = new Repository(Paper, redis)

const runner = new Benchmrk()
const fetch  = performance.timerify(repo.fetch.bind(repo))
const save   = performance.timerify(repo.save.bind(repo))

// Findings
// - `repo.save()` time increases linearly in relation to max num of boards.
// - `board.addItem(item)` size does not have a lot of impact on time

await redis.flushall()
await runner.run([
  {
    name: 'paper',
    cycles: 1000,
    fn: async () => {
      const paper     = await fetch({ id: 'foo' }) || new Paper({ id: 'foo' })
      const addBoard  = performance.timerify(paper.addBoard.bind(paper))
      const lastBoard = paper.boards.at(-1)
      const addItem   = performance.timerify(lastBoard.addItem.bind(lastBoard))

      for (let i = 0; i < 200; i++)
        paper.reachedMaxBoards() ? null : addBoard({ id: randomId() })

      addItem(payloadKB(5))

      await save(paper)
    }
  }
])

redis.disconnect()

runner.toHistogram()
runner.toPlots()
