
define ["angular", "error"], (angular, error) ->
  angular.module('baobab.service.contacts', [])
  .service('$contacts', ['$namespaces', ($namespaces) ->

    @_list = []
    @list = () => @_list

    $namespaces.current().contacts().then (contacts) =>
      @_list = contacts
    , error._handleAPIError

    @
  ])
