const validate = require('../../lib/middleware/validate')

describe('middleware/validate', () => {
  let middleware, req

  beforeEach(() => {
    middleware = validate('test')

    req = {
      body: {}
    }
  })

  test('calls next if token matches', () => {
    req.body.token = 'test'
    const next = jest.fn()
    middleware(req, {}, next)
    expect(next).toHaveBeenCalled()
  })

  test('throws error next if does not match', () => {
    req.body.token = 'nope'
    const next = jest.fn()
    expect(() => middleware(req, {}, next)).toThrow('Invalid verificaton token')
    expect(next).not.toHaveBeenCalled()
  })
})
