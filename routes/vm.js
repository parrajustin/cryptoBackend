const { verify } = require('../util');
const co = require("co");
const virtualbox = require("virtualbox-soap");
const guid = require('guid');


function handleServer(ip, user, pass, pool, command) {
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
        // const session = yield websessionManager.getSessionObject(vbox);
        const machine = yield vbox.findMachine(command['name']);

        for (let i = 0; i < command['no']; i++ ) {
          const name = command['name'] + "_" + guid.raw() +  "_clone_" + i;
          const clone = yield vbox.createMachine('', name, [], '', '');
          yield vbox.registerMachine(clone);
          console.log('a');
          yield machine.cloneTo(clone, 2, []);

          let results = yield asyncConnection(
            connection, 
            "INSERT INTO `virtual_machine` (`VMname`, `VMvrdp`, `VMrecent_snapshot`, `VMhost_server`, `VMUID`) " +
            "VALUES (?, ?, ?, ?, ?);",
            [name, command['seed'] + i, '', ip, '']
          );
        }

        // console.log(machines);
        // console.log(command);
        websessionManager.logoff(vbox);
      } catch (error) {
        connection.release();
        console.error(error + "");
      }
    }).then(function(value) {
      console.log(value);
      connection.release();
    });
  });
}

function setupVM(app, pool) {
  app.get('/api/vm', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded.hasOwnProperty('isAdmin')) {
        pool.getConnection(function(err, connection) {
          if (err) {
            res.status(500).end();
            throw err;
          }

          connection.query('SELECT * FROM virtual_machine', function (error, results, fields) {
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

  app.post('/api/vm/clone', function(req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded['isAdmin']) {
        const commands = req.body;
        if (commands.length) {
          for (let i = 0; i < commands.length; i++) {
            pool.getConnection(function(err, connection) {
              if (err) {
                throw err;
              }

              connection.query(
                "SELECT `VMhost_server`" + 
                "FROM `virtual_machine`" + 
                "WHERE `VMname` = ?"
                , [commands[i].name], function (error, results, fields) {
              
                // Handle error after the release.
                if (error) {   
                  connection.release();
                  throw error;
                }

                connection.query(
                  "select *" +
                  "from `server`" + 
                  "WHERE `server`.`ip_address` = ?"
                  , [results[0]['VMhost_server']], function (error, results, fields) {
                  connection.release();
                
                  // Handle error after the release.
                  if (error) {   
                    throw error;
                  }
                  // console.log([results['ip_address'], results['user_name'], ['password']].join(', '));

                  handleServer(results[0]['ip_address'], results[0]['user_name'], results[0]['password'], pool, commands[i]);
                  res.status(200).end();
                });
              });
            });
          }
        }
        console.log(commands);
      }
    });
  });
}

module.exports = { setupVM };