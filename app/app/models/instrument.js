
export default DS.Model.extend({
  created: DS.attr('date'),
  user: DS.belongsTo('user', {
    inverse: 'instruments',
    async: true
  }),
  name: DS.attr('string'),
  json: DS.attr('string'),
  branchedParent: DS.belongsTo('instrument',{
    async: true,
    inverse: 'branchedChildren'
  }),
  branchedChildren: DS.hasMany('instrument', {
    async: true,
    inverse: 'branchedParent'
  }),
  branchedChildrenCount: DS.attr('number'),
  isPrivate: DS.attr('boolean'),
  stars: DS.hasMany('user', {
    async: true,
    inverse: 'stars'
  }),
  starsCount: DS.attr('number'),
  tags: DS.attr('string'),
  branchedGeneration: DS.attr('number')
});
