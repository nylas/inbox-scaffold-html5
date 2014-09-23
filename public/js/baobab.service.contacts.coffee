
define ["angular"], (angular, events) ->
  angular.module('baobab.service.contacts', [])
  .service('$contacts', ['$namespaces', ($namespaces) ->

    @_list = []
    @list = () => @_list

    $namespaces.current().contacts().then (contacts) =>
      @_list = contacts
    , _handleAPIError

    @
  ])
