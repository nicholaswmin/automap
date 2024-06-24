import { Paper, Board } from './paper/index.js'
import { Repository, rand, redis } from '../index.js'

const repo = new Repository(Paper, redis)

const paper = new Paper({ idSession: 'foo' })

for (let i = 0; i < 99; i++) {
  paper.addBoard({ id: 'board-' + i })
}

const res = await repo.save(paper)
console.log('saved', res)
