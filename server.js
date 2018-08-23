var express = require('express');
var cors = require('cors');
var path = require('path');
var bodyParser = require('body-parser');
const server = express();
const router = express.Router();
const port = process.env.PORT || 8000;
const env = process.env.NODE_ENV || 'development';

server.set('port', port);

server.use(cors());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));

server.use('/api/v1/', router);

server.use('/api/v1/*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Request resource does not exist'
  });
});

// ERROR HANDLERS
server.on('BadRequest', function (req, res, err, cb) {
  console.log(err);
  return cb();
});
//Uncaught exception handling
server.on('uncaughtException', (req, res, route, err) => {
  console.log(err);
  res.send(500, "Internal Server Error");
});

server.listen(port, () => console.log("Server started on port: %s with node env: %s ", port, env));

module.exports.server;