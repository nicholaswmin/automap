import ioredis from 'ioredis'

export default () => {
  return new ioredis('rediss://:p19b2193e1eacb89c8aa74af26aa51d67fa5d5e369138a9528a12d4b2c06614ca@ec2-52-214-237-224.eu-west-1.compute.amazonaws.com:31319', {
    keyPrefix: 'test:',
    tls: {
      rejectUnauthorized: false
    }
  })
}
