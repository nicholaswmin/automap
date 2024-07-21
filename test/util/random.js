import crypto from 'node:crypto'
import { round } from './numbers.js'

const randomId = () => crypto.randomUUID().split('-').at(-1)
const randomNum = (min = -300, max = 600) =>
  round(Math.random() * (max - min) + min)

export { randomId, randomNum }
