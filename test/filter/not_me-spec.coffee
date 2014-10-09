define ['angular', 'angularMocks', 'baobab.filter'], (angular) ->
  not_me = null
  me =
    email: "me@example.com"

  describe 'not_me filter', ->
    beforeEach ->
      angular.mock.module 'baobab.filter', ($provide) ->
        $provide.value '$namespaces',
          current: ->
            emailAddress: me.email
        return
      angular.mock.inject ($filter) ->
        not_me = $filter("not_me")
      expect(not_me).not.toBeNull()

    it "should remove elements from a list if me.email matches", ->
      result = not_me([me])
      expect(result.length).toBe(0)

    it "should not break on other items", ->
      expect(not_me(["beep"]).length).toBe(1)
