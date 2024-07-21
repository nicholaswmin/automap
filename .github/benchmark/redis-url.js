import select, { Separator } from '@inquirer/select'

const getRedisURL = async () => {
  const redisEnvVars = Object.keys(process.env)
      .filter(key => key.toLowerCase().includes('redis') &&
        key.toLowerCase().includes('redis'))

  return redisEnvVars <= 1 ? redisEnvVars[0] : await select({
    message: 'Found multiple Redis URL env vars. Select one:',
    choices: redisEnvVars.map(key => {
      return {
        name: key,
        value: process.env[key],
        description: process.env[key]
      }
    })
  })
}

export { getRedisURL }
