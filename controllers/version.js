
let _list = function(req,res,next){
  let list = [{'version':'1.0.0','description':'the original api','date':'2018-08-08'}];
  res.status(200).send(list);
  return next();
};

module.exports = {
  list        : _list
};
