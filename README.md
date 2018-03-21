# Slack Adapter for Probot

> **Heads Up!** This is a work in progress. Do not use it yet.

TODO:

- [ ] receive events
- [ ] commands
  - [x] receive
  - [x] respond
  - [ ] Handle 3 sec timeout
  - [ ] Async response with `response_url`
  - [ ] Handle errors
- [ ] authenticated web client

```js
const slack = require('@probot/slack-adapter')

// FIXME: this should be replaced by some sort of official extension API
module.exports = slack(robot => {
  // Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
  robot.on('message', context => {
    robot.log('Received a message event:', context.event)
  })

  robot.command({
    name: 'echo',
    usage: '/echo I know you are but what am I?',
    description: 'Echo back whatever I say to you',
    action: command => {
      command.respond(command.text)
    }
  })
}
```
