
const jwt = require('jsonwebtoken');
const secret = require("./../../config/local").security.key;

module.exports = async function (req, res, proceed) {

  if (req.hasOwnProperty("headers") && req.headers.hasOwnProperty("token")) {
    var token = req.headers['token']
    delete req.headers['token']
  } else if (req.param("token") !== undefined) {
    token = req.param("token");
  } else {
    res.status(401);
    res.send({ message: 'not permission' });
    return;
  }

  jwt.verify(token, secret, function (err, decoded) {
    if (err) {
      res.status(401);
      res.send({ message: 'not permission' });
      return;
    }

    proceed();
  });

};
