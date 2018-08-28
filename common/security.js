let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
let ExtractJwt = require('passport-jwt').ExtractJwt;
let JwtStrategy = require('passport-jwt').Strategy;
let crypto = require('crypto');


let User = require('../models').User;

let _tokenOptions = {};
_tokenOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
_tokenOptions.secretOrKey = process.env.SECRETKEY || 'some random word';

const _passwordCompare = async (a,b)=> {
  return bcrypt.compare(a, b);
};

const _createHashword = async (plainText)=> {
  //used to encrypt a plain text password before storing it in our db
  let salt;
  salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
};

const _generateJWTToken = (userId,spice)=> {
  //used for our auth login jwt token
  let data = {id:userId, spice:spice};
  let token = jwt.sign(data, _tokenOptions.secretOrKey);
  return token;
};

const _jwtSetup = ()=> {
  //sets up our api server to use jwt for authentication
  return new JwtStrategy(_tokenOptions,
    (jwt_payload,done)=> {
      let userId = jwt_payload.id;
      let spice = jwt_payload.spice;

      if(userId && spice){
        //auth scope limits return data to name, email, id
        User.scope('auth').findOne({where:{id: userId,spice:spice}}).asCallback(done);
      }else{
        done(null,false);
      }
    }
  );
};

const _generateResetPasswordToken =  ()=> {
  // generates the token which will be send to the end user for password resets.
  return new Promise((resolve, reject) => {
    crypto.randomBytes(20, (err,buf) => {
      if(err){
        reject(err);
      }
      else{
        resolve(buf.toString("hex"));
      }
    })
  });
}

const _generateSpice = ()=> {
  //spice is random number used to kill rogue tokens (instead of storing token in db)
  return Math.floor(Math.random() * 999999999);
}

let Security = {
  generateToken : _generateJWTToken,
  jwtSetup : _jwtSetup,
  createHashword : _createHashword,
  passwordCompare : _passwordCompare,
  generateResetPasswordToken : _generateResetPasswordToken,
  generateSpice : _generateSpice
};

module.exports = Security;
