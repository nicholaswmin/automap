import cluster from 'node:cluster'

import constants from './constants/constants.js'
import primary from './primary.js'
import worker from './worker.js'

cluster.isPrimary
  ? primary(cluster, await constants(cluster))
  : worker()
