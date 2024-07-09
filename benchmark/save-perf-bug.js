import Bench from 'bench'
import { Paper, Board } from './paper/index.js'
import { Repository, utils } from '../index.js'

const redis  = utils.ioredis()
const repo   = new Repository(Paper, redis)
const runner = new Bench()

const fetch = performance.timerify(repo.fetch.bind(repo))
const save  = performance.timerify(repo.save.bind(repo))

await runner.run([
  {
    name: 'paper',
    cycles: 1000,
    fn: async ({ cycle, taskname }) => {
      const existing = await fetch({ id: 'foo' })
      const paper = existing || new Paper({ id: 'foo' })

      const addBoard = performance.timerify(paper.addBoard.bind(paper))
      const addItem = performance.timerify(paper.boards.at(0).addItem.bind(
        paper.boards.at(0))
      )

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