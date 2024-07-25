import cluster from 'node:cluster'

import constants from './src/constants/constants.js'
import primary from './src/primary.js'
import worker from './src/worker.js'

cluster.isPrimary
  ? primary(cluster, await constants(cluster))
  : worker()
