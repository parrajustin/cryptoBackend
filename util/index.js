const verify = require('./verify');
const { async } = require('./connection');

module.exports = { verify, asyncConnection: async };