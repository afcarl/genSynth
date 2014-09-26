/* jshint node: true */
var AuthProviders = require('./auth-providers');

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'gen-synth',
    environment: environment,
    baseURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
    },

    'simple-auth': {
      store: 'simple-auth-session-store:local-storage',
      authorizer: 'authorizer:custom',
      crossOriginWhitelist: AuthProviders.crossOriginWhitelist
    },

    torii: {
      providers: {
        'local-provider': {
        },
        'facebook-connect': {
          appId: AuthProviders.facebookConnect.appId,
          scope: 'email'
        }
      }
    }
  };

  if (environment === 'development') {
    // ENV.APP.LOG_RESOLVER = true;
    ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.baseURL = '/';
    ENV.locationType = 'auto';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {

  }

  return ENV;
};
