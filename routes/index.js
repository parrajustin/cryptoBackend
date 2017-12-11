const { setupServer } = require('./server');
const { setupUser } = require('./user');
const { setupGroup } = require('./group');
const { setupUnit } = require('./unit');
const { setupGroupUnit } = require('./group_unit');

function setup(app, pool) {
  setupServer(app, pool);
  setupUser(app, pool);
  setupGroup(app, pool);
  setupUnit(app, pool);
  setupGroupUnit(app, pool);
}

module.exports = { setUpRoutes: setup };