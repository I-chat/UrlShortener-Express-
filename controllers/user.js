let Ajv = require('ajv');

let User = require('../models').User;
let Security = require('../common/security.js')
let userSchema = require('./schemas/user.json');

const resetLinkExpires = 3600000 * 24; // 24 hours

/////////

let _login = (req,res,next)=> {
  let jsonBody = req.body;
  let email = jsonBody.email;
  let password = jsonBody.password;

  if (email && password) {
    User.scope('login').findOne({ 'where': { 'email': email.toLowerCase() } })
      .then((user) => {
        if (user.id) {
          Security.passwordCompare(password, user.password)
            .then((match) => {
              if (match === true) {
                //we have a real user now gen token using id, spice
                let token = Security.generateToken(user.id, user.spice);
                res.status(200).send({token: token, user:{
                  firstname: user.firstname,
                  lastname: user.lastname,
                  email: user.email
                }});
                return next();
              } else {
                //passwords don't match
                res.status(401).send({message: "Incorrect email or password"});
                return next();
              }
            });
        } else {
          //user not found
          res.status(404).send({message: "User does not exist"})
          return next();
        }
      })
      .catch((err)=> {
        res.status(400).send({message: "User does not exist"});
        return next();
      });
  } else {
    res.status(400).send({message: "Username and password required"});
    return next();
  }
};

//CREATE USER
let _create = (req, res, next)=> {
  let jsonBody = req.body;
  let ajv = new Ajv();
  let valid = ajv.validate(userSchema, jsonBody);

  if (!valid){
    console.log(ajv.errors);
    res.status(400).send({
      message: "Required fields are invalid or missing"
    });
    return next();
  }

  let firstname = jsonBody.firstname;
  let lastname = jsonBody.lastname;
  let email = jsonBody.email.toLowerCase();
  let password = jsonBody.password;

  if (password !== jsonBody.confirmPassword) {
    res.status(400).send({
      message: "Password Mismatch",
    });
    return next();
  }
  
  let spice = Security.generateSpice();
  
  Security.createHashword(password).then(hashword=> {
    User.findOrCreate({
      where: { 'email': email },
      attributes: ['id','firstname','lastname','email','resetPasswordToken'],
      defaults: {
        'firstname': jsonBody.firstname,
        'lastname': jsonBody.lastname,
        'email': jsonBody.email,
        'password': hashword,
        'spice': spice
      }
    }).spread((user, created) => {
      if (created) {
        let token = Security.generateToken(user.id, spice);
        res.status(201).send({
                message: 'User created',
                user: {
                  firstname: user.firstname,
                  lastname: user.lastname,
                  email: user.email
                },
                token: token
              });
        return next();
      } else {
        res.status(400).send({
          message: "User with this email already exists"
        });
        return next();
      }
    }).catch((err)=> {
      let errMsg = "Error creating user.";
      if (err instanceof User.sequelize.ValidationError) {
        //CATCH SEQUELIZE MODEL VALIDATION ERRORS
        errMsg = err.message;
      }
      res.status(400).send({
        message: errMsg
      });
      return next();
    });
  });
}

let _logout = (req, res, next)=> {
  //if a user logs out we change the spice in the db so any other tokens will not work
  let userId = req.user.id; //req.user comes from passport

  User.scope('logout').findOne({ where: { 'id': userId } })
    .then((orig) => {
      if (orig) {
        //new spice
        let oldSpice = orig.spice;
        let newSpice = Math.floor(Math.random() * 999999999);;

        if (newSpice === oldSpice) { newSpice++; } //just in case        

        User.update({ 'spice': newSpice }, { where: { 'id': userId }, })
          .then(()=> {
            res.status(200).send({ 'message': 'you are now logged out' });
            return next();
          });
      } else {
        res.status(404).send({message: "User not found"});
        return next();
      }
    })
    .catch((err)=> {
      res.status(404).send({message: "Error finding User"});
      return next();
    });
};

// SEND / RESEND PASSWORD RESET EMAIL
let _sendPasswordReset = function (req, res, next) {
  let jsonBody = req.body;
  let email = jsonBody.email;
  let emailPatt = new RegExp("/\S+@\S+\.\S+/");

  if (emailPatt.test(email)) {
    res.status(400).send({message: "Invalid email pattern"});
    return next();
  }

  let user = User.scope('resetPasswordEmail').findOne(
    {
      where: { email: email.toLowerCase() }
    }).then(user => {
      if (user) {
        Security.generateResetPasswordToken().then((resetToken) => {
          let resetExpires = Date.now() + resetLinkExpires;
          user.update({
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetExpires
          }).then(() => {
            // TODO: Configure Email client and send email here.
          });
        });
      }
      else {
        res.status(400).send({message: 'Unregistered user.' });
        return next();
      }
    }).catch(err => {
      console.log(err);
      res.status(500).send({message: "Error attempting to reset password."});
      return next();
    });
}

// RESET PASSWORD WITH TOKEN
let _resetPasswordWithToken = (req, res, next)=> {
  let jsonBody = req.body;
  let token = jsonBody.token;
  let password = jsonBody.password;
  let confirmPassword = json.confirmPassword;

  if (password.length < 4 || token.length < 1 || password !== confirmPassword) {
    res.status(400).send({message: "Required fields are invalid or missing"});
    return next();
  } else {
    let user = User.scope('reset').findOne(
      {
        where: {
          resetPasswordToken: token
        }
      }).then(user => {
        if (!user) {
          res.status(400).send({message: "Invalid token"});
          return next();
        }
        if (user.resetPasswordExpires < Date.now()) {
          res.status(400).send({message: "Expired token"});
          return next();
        }
        else {
          Security.createHashword(password)
            .then((hashword) => {
              // store the hash and spice in db 
              let spice = Security.generateSpice();
              user.update({
                password: hashword,
                spice: spice,
                resetPasswordToken: null,
                resetPasswordExpires: null
              }).then(() => {
                res.status(200).send({message: 'Password Reset Success', id: user.id });
                return next();
              }).catch(err => {
                console.log(err);
                res.status(400).send({message: "Error during reset"});
                return next();
              });
            }).catch(err => {
              console.log(err);
              res.status(400).send({message: "Error during reset"});
              return next();
            });
        }
      }).catch(err => {
        console.log(err);
        res.status(400).send({message: "Error during reset"});
        return next();
      });
  }
}

module.exports = {
  login: _login,
  create: _create,
  logout: _logout,
  resetPasswordWithToken: _resetPasswordWithToken,
  sendPasswordReset: _sendPasswordReset
};
