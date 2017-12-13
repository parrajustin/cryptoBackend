module.exports = function asyncConnection(conn, query, params) {
  return new Promise(function(resolve, reject) {
    conn.query(query, params, function (error, results, fields) {

      // Handle error after the release.
      if (error) {
        reject(error);
      }

      resolve(results);
    });
  });
}