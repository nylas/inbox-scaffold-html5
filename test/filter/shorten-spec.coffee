define ['angular', 'angularMocks', 'baobab.filter'], (angular) ->
describe 'Shorten filter', ->
  shorten = null
  maxlen = 64

  beforeEach ->
    angular.mock.module('baobab.filter')
    angular.mock.inject ($filter) ->
      shorten = $filter("shorten")

  it 'should not touch short strings', ->
    str = ([1..maxlen].map () -> "a").join("")
    expect(str.length).toBe(maxlen)
    expect(shorten(str)).toBe(str)

  it 'should truncate long strings', ->
    str = ([1..(maxlen+1)].map () -> "a").join("")
    expect(str.length).toBe(maxlen + 1)
    expect(shorten(str).length).toBe(maxlen)
