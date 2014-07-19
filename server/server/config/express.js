/**
 * Module dependencies.
 */
var express = require('express'),
  mongoStore = require('connect-mongo')(express),
  helpers = require('view-helpers'),
  config = require('./config');

module.exports = function(app, passport, db) {
  app.set('showStackError', true);    

  //Should be placed before express.static
  app.use(express.compress({
    filter: function(req, res) {
      return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));

  //Don't use logger for test env
  if (process.env.NODE_ENV !== 'test') {
    app.use(express.logger('dev'));
  }

  //Set views path, template engine and default layout
  app.set('views', config.root + '/server/views');
  app.engine('html', require('hbs').__express);
  app.set('view engine', 'html');

  //Enable jsonp
  app.enable("jsonp callback");

  app.configure(function() {
    //cookieParser should be above session
    app.use(express.cookieParser());

    app.use(function(req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', config.accessControlAllowOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      res.setHeader('Access-Control-Allow-Credentials', true);
      next();
    });

    //bodyParser should be above methodOverride
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    //express/mongo session storage
    app.use(express.session({
      secret: config.session,
      store: new mongoStore({
        db: db.connection.db,
        collection: 'sessions'
      })
    }));

    //dynamic helpers
    app.use(helpers(config.app.name));

    //use passport session
    app.use(passport.initialize());
    app.use(passport.session());
    
    //routes should be at the last
    app.use(app.router);

    //Assume "not found" in the error msgs is a 404. this is somewhat silly, but valid, you can do whatever you like, set properties, use instanceof etc.
    //app.use(function(err, req, res, next) {
    //  //Treat as 404
    //  if (~err.message.indexOf('not found')) return next();
//
    //  //Log it
    //  console.error(err.stack);
//
    //  //Error page
    //  res.status(500).render('500', {
    //    error: err.stack
    //  });
    //});
  });
};
