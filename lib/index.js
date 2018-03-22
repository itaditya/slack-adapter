const bodyParser = require('body-parser')
const Commands = require('@probot/commands')
const timeout = require('connect-timeout')

const validate = require('./middleware/validate')
const commands = require('./commands')

module.exports = robot => {
  // FIXME: pass in as argument
  const options = {
    token: process.env.SLACK_VERIFICATION_TOKEN,
    commandTimeout: 1000 * 2.5,
    ackResponse: {response_type: 'in_channel'}
  }

  // FIXME: this will move into Probot once the dust settles
  robot.commands = new Commands()

  const app = robot.route('/slack')

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.post('/command',
    timeout(options.commandTimeout, {respond: false}),
    validate(options.token),
    commands(robot, options)
  )

  // FIXME: remove before shipping
  app.use((err, req, res, next) => {
    robot.log.warn({err})
    res.status(500).send()
  })
}
