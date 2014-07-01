
// requiring routes by category

module.exports = function(app, passport, auth) {
  require('./auth')(app, passport, auth);
  require('./instruments')(app, passport, auth);    

  //Home route
  var index = require('../controllers/index');
  app.get('/', index.render);
};