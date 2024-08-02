// A "fake" webserver to allow deployment (and thus benchmarking) on
// cloud providers that only allow web-server deployments, i.e Heroku.
// This can be started via `npm start`

import http from 'http'
const port = process.env.PORT || 8000

http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.write('This is a fake server to allow benchmarking on cloud providers :)')
  res.write('\nEnv vars:\n')
  res.write(JSON.stringify(process.env, null, 2))
  res.end()
}).listen(port, console.log(`Success! Running on port: ${port}`))
