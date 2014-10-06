import Ember from 'ember';

export default Ember.Component.extend({
  page: 1,
  numInstruments: 0,
  changePageHandler: null,

  instrumentsPerPage: 9,
  numPagesShown: 5,

  numPages: function() {
    return Math.ceil(
      this.get('numInstruments') /
      this.get('instrumentsPerPage'));
  }.property('numInstruments'),

  pagesBefore: function() {
    var currentPage = this.get('page'),
        numPagesShown = this.get('numPagesShown'),
        pages = [];
    for (var i=1; i<currentPage && pages.length <= numPagesShown; ++i) {
      pages.push(i);
    }
    return pages;
  }.property('page'),
  hidingPagesBefore: function() {
    return this.get('pagesBefore').length < (this.get('page')-1);
  }.property('pagesBefore.@each', 'page'),

  pagesAfter: function() {
    var currentPage = this.get('page'),
        numPages = this.get('numPages'),
        numPagesShown = this.get('numPagesShown'),
        pages = [];
    for (var i=(currentPage+1); i<=numPages && pages.length <= numPagesShown; ++i) {
      pages.push(i);
    }
    return pages;
  }.property('page', 'numPages'),
  hidingPagesAfter: function() {
    return this.get('pagesAfter').length < (this.get('numPages')-this.get('page'));
  }.property('pagesAfter.@each', 'numPages', 'page'),

  actions: {
    changePage: function(page) {
      this.sendAction('changePageHandler', page);
    }
  }
});
