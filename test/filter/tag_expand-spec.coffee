define ['angular', 'angularMocks', 'baobab.filter'], (angular) ->
  describe 'tag_expand filter', ->
    tag_expand = null

    beforeEach ->
      angular.mock.module("baobab.filter")
      angular.mock.inject ($filter) ->
        tag_expand = $filter("tag_expand")

    it 'should expand tags', ->
      tags = [
        { name: "first" },
        { name: "second" },
      ]

      expect(tag_expand(tags)).toEqual("first second ")
