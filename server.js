let express = require('express');
let passport = require('passport');
let cors = require('cors');
let path = require('path');
let JwtAnonStrategy = require('passport-anonymous').Strategy;
require('dotenv').config()
let Security = require('./common/security.js');
let bodyParser = require('body-parser');
let routes = require('./common/routes');
let db = require('./models/');

const server = express();
const router = express.Router();
const port = process.env.PORT || 8000;
const env = process.env.NODE_ENV || 'development';

routes(router);

server.set('port', port);

server.use(cors());
server.use(passport.initialize());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: false }));

//AUTH SETUP
passport.use(Security.jwtSetup());

// Use the BasicStrategy within Passport.
//   This is used as a fallback in requests that prefer authentication, but
//   support unauthenticated clients.
passport.use(new JwtAnonStrategy());

server.use('/', router);

server.listen(port, () => console.log("Server started on port: %s with node env: %s ", port, env));
