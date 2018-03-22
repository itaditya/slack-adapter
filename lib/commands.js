const request = require('request')

module.exports = (robot, options) => {
  return async function command (req, res) {
    const { command, text, ...context } = req.body
    const protocol = req.headers['x-forwarded-proto'] || req.protocol
    const host = req.headers['x-forwarded-host'] || req.get('host')
    const url = req.originalUrl

    const respond = async (message) => {
      if (res.headersSent) {
        const options = {
          url: context.response_url,
          body: message,
          json: true
        }

        await new Promise((resolve, reject) => {
          request.post(options, function (error, response, body) {
            error ? reject(error) : resolve(response)
          })
        })
      } else {
        return res.json(message)
      }
    }

    req.on('timeout', () => {
      req.log('Command taking too long. Switching to delayed response.')

      // Ack the command
      respond(options.ackResponse)
    })

    const message = await robot.commands.invoke({
      name: command.replace(/^\//, ''),
      args: text.split(' '),
      url: `${protocol}://${host}${url}`,
      context,
      respond
    })

    if (message) {
      return respond(message)
    }
  }
}
