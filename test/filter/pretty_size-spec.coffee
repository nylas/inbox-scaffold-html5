define ['angular', 'angularMocks', 'baobab.filter'], (angular) ->
  describe 'pretty_size filter', ->
    pretty_size = null

    beforeEach ->
      angular.mock.module("baobab.filter")
      angular.mock.inject ($filter) -> pretty_size = $filter("pretty_size")

    it 'should format appropriately', ->
      expect(pretty_size(999)).toEqual("999 B")
      expect(pretty_size(1000)).toEqual("1 KB")
      expect(pretty_size(1000000)).toEqual("1 MB")
      expect(pretty_size(1001)).toEqual("1 KB")
