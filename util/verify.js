const jwt = require('jsonwebtoken');
const { publicKey } = require('../key');

/**
 * Shortcut for the verification of a json web token
 *
 * @export
 * @param request request that passes token information
 * @param callback callback funtion
 */
module.exports = function verify(request, callback) {
  jwt.verify(
    request.body['token'] || request.query['token'] || request.headers['x-access-token'], 
    new Buffer(publicKey),
    { algorithms: ['RS256'] }, 
    (err, decocded) => callback(err, decocded || {})
  );
}


// jwt.sign(payload, { key: new Buffer(privateKey, 'utf8'), passphrase: 'attKey' } as any, {
//   expiresIn: '1d',
//   algorithm: 'RS256',
// }, (error, token) => {
//   res.status(200).json(new model.Response(
//     true,
//     { user: userAccount, token }
//   ));
// });