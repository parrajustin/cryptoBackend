const { verify, asyncConnection } = require('../util');
const virtualbox = require("virtualbox-soap");
const co = require("co");

function handleServer(ip, user, pass, pool) {
  pool.getConnection(function(err, connection) {
    if (err) {
      throw err;
    }

    co(function *() {
      try {
        const defaultPort = ip.split(':').length == 1;

        const serverURL = "http://" + ip + (defaultPort ? ":18083" : ""); // This url is the default one, it can be omitted 
        const websessionManager = yield virtualbox(serverURL);
        // console.log(websessionManager);
        const vbox = yield websessionManager.logon(user, pass);
        const session = yield websessionManager.getSessionObject(vbox);
        let machines;
        try {
          machines = yield vbox.getMachines();
        } catch(error) {
          machines = [];
        }
        // console.log(JSON.stringify(vbox));
        let results = yield asyncConnection(
          connection, 
          "INSERT INTO `server` (`user_name`, `password`, `status`, `ip_address`) " +
          "VALUES (?, ?, 'setting up', ?);",
          [user, pass, ip]
        );
        // connection.query(
        //   "INSERT INTO `server` (`user_name`, `password`, `status`, `ip_address`) " +
        //   "VALUES (?, ?, 'setting up', ?);"
        //   , [user, pass, ip], function (error, results, fields) {
  
        //   // Handle error after the release.
        //   if (error) {
        //     connection.release();
        //     throw error;
        //   }
        // });
  
  
        
        const len = machines.length;
  
        for (let i = 0; i < len; i++) {
          const vm = {
            'VMname': '',
            'VMvrdp': 0,
            'VMrecent_snapshot': '',
            'VMhost_server': ip,
            'VMUID': ''
          };
  
          // const netAdapters = [];
          let query = [];
          const netArray = [];
  
          const machine = machines[i];
  
          const uid = yield machine.getId();
          const name = yield machine.getName();

          // const vrdeServer = yield machine.getVRDEServer();
          // const vrdpbool = yield vrdeServer.getEnabled();
          // let props = null;

          // if (vrdpbool) {
          //   props = yield vrdeServer.getVRDEProperties();
          //   console.log(props);
          // }
  
          vm['VMUID'] = uid;
          vm['VMname'] = name;

          let results = yield asyncConnection(
            connection, 
            "INSERT INTO `virtual_machine` (`VMname`, `VMvrdp`, `VMrecent_snapshot`, `VMhost_server`, `VMUID`) " +
            "VALUES (?, ?, ?, ?, ?);",
            [vm['VMname'], -1, vm['VMrecent_snapshot'], vm['VMhost_server'], vm['VMUID']]
          );
  
          // connection.query(
          //   "INSERT INTO `virtual_machine` (`VMname`, `VMvrdp`, `VMrecent_snapshot`, `VMhost_server`, `VMUID`) " +
          //   "VALUES (?, ?, ?, ?, ?);"
          //   , [vm['VMname'], -1, vm['VMrecent_snapshot'], vm['VMhost_server'], vm['VMUID']], function (error, results, fields) {
            
          //   // Handle error after the release.
          //   if (error) {
          //     connection.release();
          //     throw error;
          //   }
          // });
  
          for (let j = 0; j < 4; j++) {
            const net = yield machine.getNetworkAdapter(j);
            const bool = yield net.getEnabled();
  
            if (!bool) {
              continue;
            }
  
            const type = yield net.getAdapterType();
            const instance = yield net.getMACAddress();
  
            // netAdapters.push(type + '_' + instance);
            query.push('(?, ?)');
            netArray.push(vm['VMname'], type + '_' + instance);
          }
  
          if (query.length > 0) {

            let results = yield asyncConnection(
              connection, 
              "INSERT INTO `vm_netadapters` (`VMname`, `Network_Adapter`) " +
              "VALUES " + query.join(', ') + ";",
              netArray
            );
            // connection.query(
            //   "INSERT INTO `vm_netadapters` (`VMname`, `Network_Adapter`) " +
            //   "VALUES " + query.join(', ') + ";"
            //   , netArray, function (error, results, fields) {
  
              
            //   // Handle error after the release.
            //   if (error) {   
            //     // And done with the connection.
            //     connection.release();
            //     throw error;
            //   }
            // });
          }
        }
  
        websessionManager.logoff(vbox);
      } catch (error) {
        connection.release();
        console.error(error + "");
      }
    }).then(function(value) {
      connection.release();
    });;
  });
}





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

              handleServer(req.body['ip'], req.body['user'], req.body['pass'], pool);
              res.status(200).end();
              
              // console.log(req.body);
              // connection.query(
              //   "INSERT INTO `server` (`user_name`, `password`, `status`, `ip_address`) " +
              //   "VALUES (?, ?, 'setting up', ?);"
              //   , [req.body['user'], req.body['pass'], req.body['ip']], function (error, results, fields) {

              //   // And done with the connection.
              //   connection.release();
                
              //   // Handle error after the release.
              //   if (error) {
              //     throw error;
              //   }
              // });
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