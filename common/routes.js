let express = require('express');
let passport = require('passport');

// controllers
let user = require('../controllers/user.js');
let version = require('../controllers/version.js')
let url = require('../controllers/url.js')

let _auth = (req)=> {
  return passport.authenticate('jwt',{session:false});
};

let _anonAuth = ()=> {
  return passport.authenticate(['jwt', 'anonymous'],{session:false});
}

// endpoints
exports = module.exports = (server)=> {

  // LOGIN
  server.post('/login', user.login);

  // LOGOUT
  server.put('/logout', _auth() , user.logout);

  // // USERS CREATE
  server.post('/users', user.create);

  // SEND RESET PASSWORD EMAIL
  server.post('/sendreset', user.sendPasswordReset)
  
  // RESET PASSWORD
  server.put('/reset', user.resetPasswordWithToken)

  // Shorten Url
  server.post('/shorten', _anonAuth(), url.shorten)
  
  // DELETE shortUrl
  server.delete('/shorten/:id', _auth(), url.destroy)

  // API Versions
  server.get('/api-versions',version.list);

  // API Homepage (also used for uptimerobot healthcheck)
  server.get('/',function(req,res,next){
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end('<html lang="en"><head><meta charset="utf-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PicoUrl</title><link rel="stylesheet" type="text/css" href="https://fonts.googleapis.com/css?family=Roboto"/></head><body style="background-color:#283E67;font-family:Roboto"><div style="position:absolute;bottom:10px;right:10px;text-align:right;padding:10px 10px 10px 15px;color:#268fdd;border:2px solid #268fdd;border-radius:10px;font-size:26px;">PicoUrl</div></body></html>');
  });

};
