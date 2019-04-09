module.exports = {
  globalSetup: './setupTest.js',
  globalTeardown: './teardown.js',
  collectCoverageFrom: [
    'api/controllers/*.js',
    'api/models/*.js',
  ]
};