const { setupServer } = require('./server');
const { setupUser } = require('./user');
const { setupGroup } = require('./group');
const { setupUnit } = require('./unit');
const { setupGroupUnit } = require('./group_unit');
const { setupWorkshop } = require('./workshop');

function setup(app, pool) {
  setupServer(app, pool);
  setupUser(app, pool);
  setupGroup(app, pool);
  setupUnit(app, pool);
  setupGroupUnit(app, pool);
  setupWorkshop(app, pool);
}

module.exports = { setUpRoutes: setup };