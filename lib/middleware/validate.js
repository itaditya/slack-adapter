const crypto = require('crypto')

/**
 * Validates that the `token` matches the expected verification token
 */
module.exports = (token) => {
  const expectedToken = Buffer.from(token)

  return (req, res, next) => {
    const actualToken = Buffer.from(req.body.token || '')
    const matches = actualToken.length === expectedToken.length &&
      crypto.timingSafeEqual(actualToken, expectedToken)

    if (matches) {
      next()
    } else {
      throw new Error('Invalid verificaton token')
    }
  }
}
