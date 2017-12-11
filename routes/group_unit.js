const { verify } = require('../util');

function setupGroupUnit(app, pool) {
  app.get('/api/groupunit/:gname', function (req, res, next) {
    verify(req, (jwtError, decoded) => {
      if (decoded.hasOwnProperty('isAdmin')) {
        pool.getConnection(function(err, connection) {
          if (err) {
            res.status(500).end();
            throw err;
          }

          connection.query('SELECT * FROM group_unit WHERE `WGname` = ?', [req.query['gname'] || req.params['gname']], function (error, results, fields) {
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

module.exports = { setupGroupUnit };