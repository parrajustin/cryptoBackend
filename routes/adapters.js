const { verify } = require('../util');

function setupAdapters(app, pool) {
  app.get('/api/adapters/:vm', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded.hasOwnProperty('isAdmin')) {
        pool.getConnection(function(err, connection) {
          if (err) {
            res.status(500).end();
            throw err;
          }

          const adapter = req.query['vm'] || req.body['vm'] || req.params['vm'];

          connection.query('SELECT * FROM vm_netadapters WHERE `VMname` = ?', [adapter], function (error, results, fields) {
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

module.exports = { setupAdapters };