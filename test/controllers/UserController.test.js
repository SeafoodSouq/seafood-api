const app = require('supertest')('http://localhost:7000');

describe('User Controller', () => {
  describe('login user', () => {
    it('should login user', () =>

      app
        .put('/api/login')
        .field('email', 'osmany@seafoodsouq.com')
        .field('password', '89360058Ab')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200));
  });
});