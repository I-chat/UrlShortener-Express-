let ShortUrl = require('../models').ShortUrl;
let models = require('../models').associations;
let LongUrl = require('../models').LongUrl;
let validator = require('validator');
let sequelize = require('../models').sequelize;
let baseUrl = process.env.HOST || 'http://127.0.0.1:3000/';


let _shorten = async (req,res,next)=> {
  let jsonBody = req.body;
  let url = jsonBody.url;
  let valid = validator.isURL(url);
  let isUnique = false;
  let userId = req.user ? req.user.id : 0;
  let vanityString;
  let shortUrl;

  if (!valid){
    res.status(400).send({
      message: "Required fields are invalid or missing"
    });
    return next();
  }

  if (req.user){
    vanityString = jsonBody.vanityString;
  }

  if(vanityString){
    shortUrl = vanityString.toLowerCase();
  }else{
    while(!isUnique){
      try {
        shortUrl = vanityString || Math.random().toString(36).substring(7).toLowerCase();
        let shortUrlResult = await ShortUrl.findOne({where:{url: shortUrl}})
        if(!shortUrlResult){
          isUnique = true;
        }
      }
      catch(err) {
        console.log('errr', err)
      }
    }
  }

  return sequelize.transaction((t)=>{
    return LongUrl.findOrCreate({where: {url: url}, defaults: {url:url}, transaction: t})
    .spread((longUrl, created)=>{
      return ShortUrl.findOrCreate({where: {url: shortUrl}, defaults:{url:shortUrl, UserId:userId, longId:longUrl.id}, transaction: t})
      .spread((shortUrl, created)=>{
        if(created){
          return longUrl.sequelize.models.UserLongUrl.create({longId:longUrl.id, userId:userId}, {transaction: t})
          .then((asso)=>{
            res.status(201).send({message:'Short URL created',
                                  url: baseUrl+shortUrl.url,
                                  id: shortUrl.id
                                });
            return next();
          }).catch(err=>{
            console.log(err);
            return ShortUrl.find({where:{userId: userId,longId:longUrl.id}}).then(url=>{
              res.status(200).send({message:'Short URL created',
                                    url: baseUrl+url.url,
                                    id: url.id
                                  });
              return next();
            }).catch(err=>{
              res.status(400).send({message:'An unexpected error occurred.'});
              return next(err);
            })
          })
        }else{
          return t.rollback().then(()=>{
            // short url was found and should be unique, hence we raise the appropraite Errors
            res.status(409).send({message:'vanityString is currently in use.'});
            return next();
          })
        }
      }).catch(err=>{
        res.status(400).send({message:'An unexpected error occurred.'});
        return next(err);
      })
    })
  })
}

let _destroy = (req,res,next)=> {
  let urlId = req.params.id;
  let userId = req.user.id;

  return ShortUrl.findOne({where:{id: urlId, userId: userId}}).then(url=>{
    if(url){
      url.destroy().then(() => {
        res.status(200).send({message:'URL deleted'});
        return next();
      }).catch(()=>{
        res.status(400).send({message: 'Error deleting URL'});
        return next();
      })
    }else {
      res.status(404).send({message: 'URL not Found'});
      return next();
    }
  });
}

module.exports = {
  shorten: _shorten,
  destroy: _destroy
};
