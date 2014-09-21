/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Instrument = mongoose.model('Instrument'),
    User = mongoose.model('User'),
    UsersController = require('./users'),
    _ = require('lodash'),
    async = require('async');

/**
 * Find instrument by id
 */
exports.instrument = function(req, res, next, id) {
  Instrument.findOne({
      _id: id
    })
    .populate([{path: 'user'}, {path: 'stars'}, {path: 'branchedChildren'}])
    .exec(function(err, instrument) {
      if (err)
        return next(err);
      if (!instrument)
        return next(new Error('Failed to load instrument ' + id));

      req.instrument = instrument;
      next();
    });
};

/**
 * Create a instrument
 */
exports.create = function(req, res) {
  var params = req.body.instrument,
      branchedParentId = params.branchedParent;
  var instrument = new Instrument({
    user: req.user,
    branchedParent: branchedParentId,
    branchedGeneration: params.branchedGeneration,
    json: params.json,
    name: params.name,
    stars: []
  });

  async.waterfall([
    // save instrument
    function(callback) {
      instrument.save(function(err) {
        callback(err);
      });
    },
    // add instrument to user's instruments
    function(callback) {
      User.update(
        {_id: req.user.id},
        {$addToSet:{instruments: instrument.id}},
        {}, function(err) {
          callback(err);
        });
    },
    // add instrument to branchedParent's children
    function(callback) {
      if (branchedParentId) {
        Instrument.update(
          {_id: branchedParentId},
          {$addToSet:{branchedChildren: instrument.id}},
          {}, function(err) {
            if (err)
              callback(err);
            else {
              // update the branched children count
              Instrument.findById(branchedParentId, function(err, inst) {
                inst.branchedChildrenCount = inst.branchedChildren.length;
                inst.save(function(err) {
                  callback(err);
                });
              });
            }
          });
      }
      else
        callback();
    },
    // populate new instrument to return it
    function(callback) {
      Instrument.populate(
        instrument, [{path:'user'}, {path:'stars'}],
        function(err, instrument) {
          callback(err, instrument);
      });
    }
    ], function(err, instrument) {
      if (err) {
        res.status(500);
        res.jsonp({
          msg: 'error populating'
        });
      }
      else
        res.send(toObject(instrument));
    });
};

/**
 * Update a instrument
 */
exports.update = function(req, res) {

  var instrument = req.instrument;

  if (instrument.get('user.id') !== req.user.id) {
    res.status(500);
    res.jsonp({
      msg: 'error: Not creator'
    });
    return;
  }

  instrument.name = req.body.instrument.name;
  instrument.isPrivate = req.body.instrument.isPrivate;
  instrument.tags = req.body.instrument.tags;

  instrument.save(function(err) {
    if (err) {
      res.status(500);
      res.jsonp({
        msg: 'error'
      });
    } else {
      res.send(toObject(instrument));
    }
  });
};

exports.star = function(req, res) {
  var instrument = req.instrument;
  var user = req.user;
  Instrument.update(
    {_id:instrument.id},
    {$addToSet:{stars: user.id}},
    {},function(err) {
      if (err) {
        res.status(500);
        res.jsonp({
          msg: 'error'
        });
        return;
      }
      Instrument.findById(instrument.id, function(err, instrument) {
        instrument.starsCount = instrument.stars.length;
        instrument.save(function(err) {
          if (err) {
            res.status(500);
            res.jsonp({
              msg: 'error'
            });
          }
          else {
            User.update(
              {_id:user.id},
              {$addToSet:{stars: instrument.id}},
              {},function(err) {
                if (err) {
                  res.status(500);
                  res.jsonp({
                    msg: 'error'
                  });
                }
                else {
                  res.jsonp({
                    succeeded: true,
                    starsCount: instrument.starsCount
                  });
                }
              }
            );
          }
        });
      });
    }
  );
};
exports.unstar = function(req, res) {
  var instrument = req.instrument;
  var user = req.user;
  Instrument.update(
    {_id:instrument.id},
    {$pull:{stars: user.id}
    },{},function(err) {
      if (err) {
        res.status(500);
        res.jsonp({
          msg: 'error'
        });
        return;
      }
      Instrument.findById(instrument.id, function(err, instrument) {
        instrument.starsCount = instrument.stars.length;
        instrument.save(function(err) {
          if (err) {
            res.status(500);
            res.jsonp({
              msg: 'error'
            });
          }
          else {
            User.update(
              {_id:user.id},
              {$pull:{stars: instrument.id}},
              {},function(err) {
                if (err) {
                  res.status(500);
                  res.jsonp({
                    msg: 'error'
                  });
                }
                else {
                  res.jsonp({
                    succeeded: true,
                    starsCount: instrument.starsCount
                  });
                }
              }
            );
          }
        });
      });
    }
  );
};

/**
 * Delete an instrument
 */
exports.destroy = function(req, res) {
  var instrument = req.instrument;

  instrument.remove(function(err) {
    if (err) {
      res.status(500);
      res.jsonp({
        msg: 'error'
      });
    } else {
      res.jsonp(toObject(instrument));
    }
  });
};

/**
 * Show an instrument
 */
exports.show = function(req, res) {
  if (req.instrument.isPrivate &&
      (!req.user || req.instrument.user.id !== req.user.id))
  {
    res.status(500);
    res.jsonp({
      msg: 'error: instruments is private and not creator'
    });
    return;
  }
  res.jsonp(toObject(req.instrument));
};

/**
 * List of Instruments
 */
exports.index = function(req, res) {
  var currentUserId = req.user ? req.user.id : 0,
      queryParams = req.query,
      sortParams = "",
      countLimit = queryParams.countLimit,
      searchQuery = queryParams.searchQuery;

  if (queryParams.sortBy) {
    sortParams += queryParams.sortBy;
    delete queryParams.sortBy;
  }
  sortParams+= ' -created';

  if (countLimit) {
    delete queryParams.countLimit;
  }

  if (searchQuery) {
    queryParams.$text = {
      $search: searchQuery
    };
    sortParams += ' $meta.textScore';
    delete queryParams.searchQuery;
  }

  // in case given a list of ids, convert it over to
  // what mongoDB expects
  if (queryParams.ids) {
    queryParams._id = {
      $in: queryParams.ids
    };
    delete queryParams.ids;
  }

  var query = Instrument.find(queryParams)
            .sort(sortParams);

  if (countLimit)
    query = query.limit(countLimit);

  query.populate([{path: 'user'}, {path: 'stars'}, {path: 'branchedChildren'}])
       .exec(function(err, instruments) {
          if (err) {
            res.status(500);
            res.jsonp({
              msg: 'error'
            });
          } else {
            instruments = toObjects(instruments);
            instruments.instruments = _.filter(instruments.instruments,
              function(instrument) {
                return !instrument.isPrivate ||
                       instrument.user === currentUserId;
              });

            res.send(instruments);
          }
        }
  );
};

function toObjects(arr) {
  var objs = [],
      users = [];
  _.forEach(arr, function(item) {
    var obj = toObject(item);
    objs.push(obj.instrument);
    users = users.concat(obj.users);
  });
  return {
    instruments: objs,
    users: users
  };
}

function toObject(item) {
  var stars = _.map(item.stars, function(item) {
    return item.id;
  });
  var children = _.map(item.branchedChildren, function(item) {
    return item.id;
  });

  return {
    instrument: {
      id: item.id,
      created: item.created,
      user: item.user.id,
      name: item.name,
      json: item.json,
      branchedParent: item.branchedParent,
      branchedGeneration: item.branchedGeneration,
      branchedChildren: children,
      branchedChildrenCount: item.branchedChildrenCount,
      isPrivate: item.isPrivate,
      stars: stars,
      starsCount: item.starsCount,
      tags: item.tags
    },
    users: _.map(item.stars, function(user) {
      // TODO: Fix ids?
      return UsersController.toObject(user);
    })
  };
}
exports.toObject = toObject;
