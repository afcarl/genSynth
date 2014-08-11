import Ember from 'ember';
var Visualizer = require('asNEAT/asNEAT-visualizer')['default'];

export default Ember.Component.extend({
  // passed in
  instrumentNetwork: null,
  selected: false,
  isLive: false,
  index: 0,

  selectable: false,
  showAdvanced: false,

  instrumentModel: null,

  makeLiveHandler: null,

  width: "100%",
  height: "100%",

  // created on init
  visualization: null,
  isShowingNetwork: false,

  isSaved: function() {
    var model = this.get('instrumentModel');
    return model !== null && model !== undefined;
  }.property('instrumentModel'),

  isPublished: function() {
    var isPrivate = this.get('instrumentModel.isPrivate');
    return (typeof isPrivate !== 'undefined') && !isPrivate;
  }.property('instrumentModel.isPrivate'),

  selector: function() {
    return "#"+this.elementId+' .visualizer';
  }.property('elementId'),

  numberOfLikes: function() {
    var model = this.get('instrumentModel');
    if (!model)
      return 0;
    else
      return model.get('likes').content.length;
  }.property('instrumentModel.likes'),

  initVisualization: function() {
    Ember.run.scheduleOnce('afterRender', this, function() {
      var visualization = Visualizer.createInstrumentVisualization({
        network: this.get('instrumentNetwork'),
        selector: this.get('selector'),
        width: this.get('width'),
        height: this.get('height'),
        // offwhite, green, yellow, Orange, red, purple, black
        colorScaleColors: ['#f8f8f8', '#308014', '#b2b200', '#cc8400', '#cc0000', '#660066', '#000000'],
        // following y=sqrt(x) for x_delta = 0.166667
        colorScalePositions: [0,0.40824829,0.577350269,0.707106781,0.816496581,0.912870929,1]
      });
      visualization.init();
      visualization.start();
      this.set('visualization', visualization);
    });
  }.on('init'),

  willDestroy: function() {
    this._super();
    this.get('visualization').stop();
  },

  actions: {
    play: function() {
      this.get('instrumentNetwork').play();
    },

    save: function() {
      var controller = this.get('targetObject'),
          applicationCtrl = controller.get('controllers.application');

      // Check if user is logged in first
      if (!controller.get('session').get('isAuthenticated')) {
        applicationCtrl.send('showLogin');
        return;
      }

      var self = this,
          store = controller.get('.store');
      var instrument = store.createRecord('instrument', {
        created: Date.now(),
        name: 'new Instr',
        json: this.get('instrumentNetwork').toJSON(),
        isPrivate: true
      });
      instrument.save().then(function(instrument) {
        self.set('instrumentModel', instrument);
      }, function(error) {
        // TODO: Show error?
        console.log('error saving: '+error);
      });
    },

    toggleSelected: function() {
      if (this.get('selectable'))
        this.set('selected', !this.get('selected'));
    },

    makeLive: function() {
      var makeLiveHandler = this.get('makeLiveHandler');
      this.get('targetObject').send(makeLiveHandler, this);
    },

    toggleNetwork: function() {
      var vis = this.get('visualization');
      if (vis.isShowingNetwork) {
        vis.hideNetwork();
        this.set('isShowingNetwork', false);
      }
      else {
        vis.showNetwork();
        this.set('isShowingNetwork', true);
      }
    }
  }
});