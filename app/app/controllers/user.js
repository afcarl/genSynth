import Ember from 'ember';
var Network = require('asNEAT/network')['default'];

export default Ember.Controller.extend({

  // set by route
  // {instruments: []}
  content: null,

  instrumentParams: function() {
    var instruments = this.get('content.instruments');
    if (!instruments.toArray)
      return [];

    return _.map(instruments.toArray(),
      function(instrument) {
        return {
          instrumentNetwork: Network.createFromJSON(instrument.get('json')),
          selected: false,
          isLive: false,
          index: 0,
          instrumentModel: instrument
        };
    });
  }.property('content.instruments.@each')
});
