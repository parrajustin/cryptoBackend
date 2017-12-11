const SHA256 = require("crypto-js/sha256");
const cryptojs = require('crypto-js');
const crypto = require('crypto');
const { verify } = require('../util');
const { privateKey } = require('../key');
const jwt = require('jsonwebtoken');


function setupWorkshop(app, pool) {
  app.get('/api/temp', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded.hasOwnProperty('isAdmin')) {
        pool.getConnection(function(err, connection) {
          if (err) {
            res.status(500).end();
            throw err;
          }

          connection.query('SELECT * FROM workshop_unit WHERE WUpersistence_session = 0', function (error, results, fields) {
            // And done with the connection.
            connection.release();

            if (error) {
              // Handle error after the release.
              res.status(500).end();
              throw error;
            }

            res.status(200).json(results);
          });
        });
      } else {
        res.status(401).end();
      }
    });
  });


  
  app.get('/api/persistant', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded.hasOwnProperty('isAdmin')) {
        pool.getConnection(function(err, connection) {
          if (err) {
            res.status(500).end();
            throw err;
          }

          connection.query('SELECT * FROM workshop_unit WHERE WUpersistence_session = 1', function (error, results, fields) {
            // And done with the connection.
            connection.release();

            if (error) {
              // Handle error after the release.
              res.status(500).end();
              throw error;
            }

            res.status(200).json(results);
          });
        });
      } else {
        res.status(401).end();
      }
    });
  });
}

module.exports = { setupWorkshop };