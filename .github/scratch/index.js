import Benchmrk from 'benchmrk'
import { Paper } from './paper/index.js'
import { Repository, utils } from '../../index.js'

const redis  = utils.ioredis()
const repo   = new Repository(Paper, redis)

const runner = new Benchmrk()
const fetch  = performance.timerify(repo.fetch.bind(repo))
const save   = performance.timerify(repo.save.bind(repo))

await redis.flushall()
await runner.run([
  {
    name: 'paper',
    cycles: 1000,
    fn: async () => {
      const paper     = await fetch({ id: 'foo' }) || new Paper({ id: 'foo' })

      const addBoard  = performance.timerify(paper.addBoard.bind(paper))
      const lastBoard = paper.boards.at(0)
      const addItem   = performance.timerify(lastBoard.addItem.bind(lastBoard))

      for (let i = 0; i < 100; i++)
        addBoard({ id: utils.randomID() })

      addItem(utils.payloadKB(5))

      await save(paper)
    }
  }
])

redis.disconnect()

runner.toHistograms()
runner.toPlots()
