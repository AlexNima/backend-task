const request = require('supertest')
const app = require('../../src/app')

describe('Test Endpoint', () => {
  it('test best clients', async () => {
    const response = await request(app).get(
      '/admin/best-clients?start=2019-08-15&end=2023-08-15&limit=2'
    )
    expect(response.statusCode).toBe(200)
    expect(response.body).toHaveLength(2)
  })
})
