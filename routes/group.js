const { verify } = require('../util');
const virtualbox = require("virtualbox-soap");
const co = require("co");

function setupGroup(app, pool) {
  
  app.get('/api/group', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded.hasOwnProperty('isAdmin')) {
        pool.getConnection(function(err, connection) {
          if (err) {
            res.status(500).end();
            throw err;
          }

          connection.query('SELECT * FROM workshop_group', function (error, results, fields) {
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




  app.post('/api/group/add', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded['isAdmin']) {
        pool.getConnection(function(err, connection) {
          if (err) {
            res.status(500).end();
            throw err;
          }

          connection.query('SELECT * FROM workshop_group WHERE WGname = ?', [req.body['name']], function (error, results, fields) {
            if (error) {
              // And done with the connection.
              connection.release();

              res.status(500).end();

              // Handle error after the release.
              throw error;
            }
            
            if (results.length == 0) {
              // found nothing lets start making the group
              connection.query(
                "INSERT INTO `workshop_group` (`WGname`, `WGdescription`, `WGpersistence_session`, `WGhost`, `WGstatus`, `WGpublished_date`) " +
                "VALUES (?, ?, ?, '', 0, ?);"
                , [req.body['name'], req.body['desc'], req.body['persist'], new Date()], function (error, results, fields) {
                
                // Handle error after the release.
                if (error) {    
                  // And done with the connection.
                  connection.release();

                  res.status(500).end();
                  throw error;
                }

                // now lets setup the group <-> unit connections
                let query = "INSERT INTO `group_unit` (`WGname`, `WUname`) VALUES ";
                let vars = [];
                
                const unitsLen = (req.body['units'] || []).length;
                if (unitsLen > 0) {
                  for (let i = 0; i < unitsLen - 1; i++) {
                    query += "(?, ?), ";
                    vars.push(req.body['name'], req.body['units'][i]);
                  }
                  query += "(?, ?);";
                  vars.push(req.body['name'], req.body['units'][unitsLen-1]);

                  connection.query(
                    query, vars, function(error, results, fields) {
                      connection.release();

                      // Handle error after the release.
                      if (error) {    
                        res.status(500).end();
                        throw error;
                      }

                      res.status(200).end();
                    }
                  );
                } else {
                  connection.release();
                  res.status(200).end();
                }
              });
            } else { 
              connection.release();
              res.status(200).json({'success': false, 'reason': `server with ip ${req.body['ip']} already exists!`});
            }
          });
        });
      } else {
        res.status(401).end();
      }
    });
  });



  app.post(['/api/group/remove/:group', '/api/group/remove'], function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded['isAdmin']) {
        const groupToDelete =  req.query['group'] || req.body['group'] || req.param['group'];
        if (!groupToDelete) {
          res.status(400).end();
        } else {
          pool.getConnection(function(err, connection) {
            if (err) {
              res.status(500).end();
              throw err;
            }

            connection.query('DELETE FROM group_reference_material WHERE WGname = ?', [groupToDelete], function (error, results, fields) {
              if (error) {
                // And done with the connection.
                connection.release();

                res.status(500).end();

                // Handle error after the release.
                throw error;
              }

              connection.query('DELETE FROM group_unit WHERE WGname = ?', [groupToDelete], function (error, results, fields) {
                if (error) {
                  // And done with the connection.
                  connection.release();

                  res.status(500).end();

                  // Handle error after the release.
                  throw error;
                }
                
                connection.query('DELETE FROM workshop_group WHERE WGname = ?', [groupToDelete], function (error, results, fields) {
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
        }
      }
    });
  });
}

module.exports = { setupGroup };