const SHA256 = require("crypto-js/sha256");
const cryptojs = require('crypto-js');
const crypto = require('crypto');
const { verify } = require('../util');
const { privateKey } = require('../key');
const jwt = require('jsonwebtoken');


function setupUser(app, pool) {
  
  app.get('/api/user', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded.hasOwnProperty('isAdmin')) {
        pool.getConnection(function(err, connection) {
          if (err) {
            res.status(500).end();
            throw err;
          }

          connection.query('SELECT email, first_name, last_name, organization, skill_level, is_admin FROM registered_user', function (error, results, fields) {
            // And done with the connection.
            connection.release();

            if (error) {
              // Handle error after the release.
              res.status(500).end();
              throw error;
            }

            const len = results.length;
            for (let i = 0; i < len; i++) {
              results[i]['is_admin'] = results[i]['is_admin'].toString('hex') != '00';
            }

            res.status(200).json(results);
          });
        });
      } else {
        res.status(401).end();
      }
    });
  });





  app.post('/api/user/login', function (req, res, next) {
    pool.getConnection(function(err, connection) {
      if (err) {
        throw err;
      }

      connection.query('SELECT * FROM registered_user WHERE email = ?', [req.body['email']], function (error, results, fields) {
        // And done with the connection.
        connection.release();
        
        // Handle error after the release.
        if (error) {
          throw error;
        }

        const pass = results.length > 0 ? cryptojs.SHA256((req.body['pass'] + results[0]['salt']).trim()) : '';
        if (results.length > 0 && pass.toString(cryptojs.enc.Hex) === results[0]['password']) {
          jwt.sign(
            {
              'email': results[0]['email'],
              'isAdmin': results[0]['is_admin'].toString('hex') != '00',
              'fname': results[0]['first_name'],
              'lname': results[0]['last_name']
            }, 
            { key: new Buffer(privateKey, 'utf8'), passphrase: 'attKey' }, 
            {
              expiresIn: '1d',
              algorithm: 'RS256',
            }, (error, token) => {
              if (error) throw error;

              res.status(200).json(
                {
                  'success': true, 
                  'token': token, 
                  'fname': results[0]['first_name'],
                  'lname': results[0]['last_name'],
                  'skill': results[0]['skill_level'],
                  'isAdmin': results[0]['is_admin'].toString('hex') != '00',
                }
              );
            }
          );
        } else {
          // incorrect password
          res.status(200).json({'success': false, 'reason': `Email and password combination not found!`})
        }
      });
    });
  });



  app.post('/api/user/register', function (req, res, next) {
    pool.getConnection(function(err, connection) {
      if (err) {
        throw err;
      }

      connection.query('SELECT * FROM registered_user WHERE email = ?', [req.body['email']], function (error, results, fields) {
        if (error) {
          // And done with the connection.
          connection.release();

          // Handle error after the release.
          throw error;
        }
    
        if (results.length == 0) {
          // no other accounts found with same email
          crypto.randomBytes(8, (err, buf) => {
            if (err) throw err;
            const pass = cryptojs.SHA256((req.body['pass'] + buf.toString('hex')).trim());

            connection.query(
              "INSERT INTO `registered_user` (`email`, `password`, `first_name`, `last_name`, `organization`, `skill_level`, `is_admin`, `salt`) " +
              "VALUES (?, ?, ?, ?, ?, ?, 0, ?);", 
              [
                req.body['email'], 
                pass.toString(cryptojs.enc.Hex),
                req.body['fname'],
                req.body['lname'],
                req.body['org'],
                req.body['skill'],
                buf.toString('hex'),
              ], function (error, results, fields) {
                // And done with the connection.
                connection.release();
      
                // Handle error after the release.
                if (error) throw error;

                jwt.sign(
                  {
                    'email': req.body['email'],
                    'isAdmin': false,
                    'fname': req.body['fname'],
                    'lname': req.body['lname'],
                    'org': req.body['org'],
                    'skill': req.body['skill']
                  }, 
                  { key: new Buffer(privateKey, 'utf8'), passphrase: 'attKey' }, 
                  {
                    expiresIn: '1d',
                    algorithm: 'RS256',
                  }, (error, token) => {
                    if (error) throw error;

                    res.status(200).json({'success': true, 'token': token})
                  }
                );
            });
          });
        } else {
          connection.release();
          // account found with same email
          res.status(200).json({'success': false, 'reason': `Account with email ${req.body['email']} already exists!`})
        }
      });
    });
  });



  app.post(['/api/user/remove/:user', '/api/user/remove'], function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded['isAdmin']) {
        const toDelete =  req.query['user'] || req.body['user'] || req.param['user'];
        console.log(toDelete);
        if (!toDelete) {
          res.status(400).end();
        } else {
          pool.getConnection(function(err, connection) {
            if (err) {
              res.status(500).end();
              throw err;
            }

            connection.query('DELETE FROM `user_history` WHERE email = ?', [toDelete], function (error, results, fields) {
              if (error) {
                // And done with the connection.
                connection.release();

                res.status(500).end();

                // Handle error after the release.
                throw error;
              }
                
              connection.query('DELETE FROM `registered_user` WHERE email = ?', [toDelete], function (error, results, fields) {
                // And done with the connection.
                connection.release();

                if (error) {
                  res.status(500).end();
    
                  // Handle error after the release.
                  throw error;
                }

                res.status(200).end();
              });
            });
          });
        }
      }
    });
  });
}

module.exports = { setupUser };