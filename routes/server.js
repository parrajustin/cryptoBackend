const { verify } = require('../util');
const virtualbox = require("virtualbox-soap");
const co = require("co");

function setupServer(app, pool) {
  
  app.get('/api/server', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded['isAdmin']) {
        pool.getConnection(function(err, connection) {
          if (err) {
            throw err;
          }

          connection.query('SELECT user_name, status, ip_address FROM server', function (error, results, fields) {
            // And done with the connection.
            connection.release();

            if (error) {
              // Handle error after the release.
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




  app.post('/api/server/add', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded['isAdmin']) {
        pool.getConnection(function(err, connection) {
          if (err) {
            throw err;
          }

          connection.query('SELECT * FROM server WHERE ip_address = ?', [req.body['ip']], function (error, results, fields) {
            if (error) {
              // And done with the connection.
              connection.release();

              // Handle error after the release.
              throw error;
            }

            console.log(results);
            
            if (results.length == 0) {
              // co(function *() {
              //   try {
              //       const serverURL = "http://localhost:18083"; // This url is the default one, it can be omitted 
              //       const websessionManager = yield virtualbox(serverURL);
              //       const vbox = yield websessionManager.logon(req.body['user'], req.body['pass']);
              //       // const machine = yield vbox.findMachine("myMachineNameOrId");
              //       // const session = yield websessionManager.getSessionObject(vbox);
              //       // const progress = yield machine.launchVMProcess(session);
              //       // yield progress.waitForCompletion(-1);
              //       // const machineState = yield machine.getState();
              //       console.log(`The virtual machine is ${vbox}`);
              //       // ... 
              //   } catch (error) {
              //       console.error(error + "");
              //   }
              // });
              console.log(req.body);
              connection.query(
                "INSERT INTO `server` (`user_name`, `password`, `status`, `ip_address`) " +
                "VALUES (?, ?, 'setting up', ?);"
                , [req.body['user'], req.body['pass'], req.body['ip']], function (error, results, fields) {

                // And done with the connection.
                connection.release();
                
                // Handle error after the release.
                if (error) {
                  throw error;
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



  app.post(['/api/server/remove/:server', '/api/server/remove'], function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded['isAdmin']) {
        const toDelete =  req.query['server'] || req.body['server'] || req.param['server'];
        if (!toDelete) {
          res.status(400).end();
        } else {
          pool.getConnection(function(err, connection) {
            if (err) {
              res.status(500).end();
              throw err;
            }

            connection.query('DELETE FROM `virtual_machine` WHERE VMhost_server = ?', [toDelete], function (error, results, fields) {
              if (error) {
                // And done with the connection.
                connection.release();

                res.status(500).end();

                // Handle error after the release.
                throw error;
              }
                
              connection.query('DELETE FROM `server` WHERE ip_address = ?', [toDelete], function (error, results, fields) {
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

module.exports = { setupServer };