const { verify } = require('../util');
const virtualbox = require("virtualbox-soap");

function setupUnit(app, pool) {
  
  app.get('/api/unit', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded.hasOwnProperty('isAdmin')) {
        pool.getConnection(function(err, connection) {
          if (err) {
            res.status(500).end();
            throw err;
          }

          connection.query('SELECT * FROM workshop_unit', function (error, results, fields) {
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



  
  app.post('/api/unit/:outlet', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded['isAdmin']) {
        if (req.params['outlet'] === 'add') {
          pool.getConnection(function(err, connection) {
            if (err) {
              res.status(500).end();
              throw err;
            }

            connection.query('SELECT * FROM workshop_unit WHERE WUname = ?', [req.body['name']], function (error, results, fields) {
              if (error) {
                // And done with the connection.
                connection.release();

                res.status(500).end();

                // Handle error after the release.
                throw error;
              }

              console.log(results);
              
              if (results.length == 0) {
                connection.query(
                  "INSERT INTO `workshop_unit` (`WUname`, `WUdescription`, `WUpersistence_session`, `WUhost`, `WUpublished_date`, `WUstatus`) " +
                  "VALUES (?, ?, ?, ?, ?, 1);"
                  , [req.body['name'], req.body['description'], req.body['persist'], req.body['host'], new Date()], function (error, results, fields) {
  
                  // And done with the connection.
                  connection.release();
                  
                  // Handle error after the release.
                  if (error) {  
                    res.status(500).end();
                    throw error;
                  }

                  res.status(200).end();
                });
              } else { 
                connection.release();
                res.status(200).json({'success': false, 'reason': `unit with name ${req.body['name']} already exists!`});
              }


            });
          });
        } else {
          res.status(400).json({'successs': false});
        }
      } else {
        res.status(401).end();
      }
    });
  });



  app.post(['/api/unit/remove/:unit', '/api/unit/remove'], function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded['isAdmin']) {
        const toDelete =  req.query['unit'] || req.body['unit'] || req.param['unit'];
        if (!toDelete) {
          res.status(400).end();
        } else {
          pool.getConnection(function(err, connection) {
            if (err) {
              res.status(500).end();
              throw err;
            }

            connection.query('DELETE FROM unit_reference_material WHERE WUname = ?', [toDelete], function (error, results, fields) {
              if (error) {
                // And done with the connection.
                connection.release();

                res.status(500).end();

                // Handle error after the release.
                throw error;
              }
              
              connection.query('DELETE FROM group_unit WHERE WUname = ?', [toDelete], function (error, results, fields) {
                if (error) {
                  // And done with the connection.
                  connection.release();
  
                  res.status(500).end();
  
                  // Handle error after the release.
                  throw error;
                }

                connection.query('DELETE FROM unit_vm WHERE WUname = ?', [toDelete], function (error, results, fields) {
                  if (error) {
                    // And done with the connection.
                    connection.release();

                    res.status(500).end();

                    // Handle error after the release.
                    throw error;
                  }
                  
                  connection.query('DELETE FROM workshop_unit WHERE WUname = ?', [toDelete], function (error, results, fields) {
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
            });
          });
        }
      }
    });
  });
}

module.exports = { setupUnit };