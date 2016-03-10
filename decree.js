'use strict'

const Minimist = require('minimist')
const Jsonic = require('jsonic')
const Patrun = require('patrun')()
const _ = require('lodash')

module.exports = (opts, scripts, ready) => {

  // A catch all in case we get no match.
  let catch_all = (opts, server, done) => {
    const seneca = server.seneca
    seneca.ready(() => {
      seneca.log.info('PORT', server.info.port)
      server.start(done)
    })
  }

  // map each script to it's pattern and
  // update the catch_all if one is provided
  _.each(scripts, (map) => {
    if (map.pin) Patrun.add(map.pin, map.script)
    else catch_all = map.script
  })

  // get our input and based on it, our pattern
  const input = (Minimist(process.argv.slice(2))._[0] || process.env.START || ''
  const pattern = Jsonic(input)

  // match our pattern or use the catch_all.
  let match = Patrun.find(pattern)
  if (match) match = wrap(match)
  else match = wrap(catch_all)

  // run the hapi server with the
  // selected scrpt passed in.
  return ready(opts, match)
}

// handle any errors
function endOnError (err) {
  if (err) {
    console.log(err)
    process.exit(1)
  }
}

// some wrapping to keep script pluggability
// simple to reckon about. Maps script call.
function wrap (inner) {
  const wrapper = (err, opts, server) => {
    endOnError(err)

    return inner(opts, server, (err) => {
      endOnError(err)
    })
  }

  return wrapper
}
