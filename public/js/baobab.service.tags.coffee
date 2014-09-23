
define ["angular"], (angular, events) ->
  angular.module('baobab.service.tags', [])
  .service('$tags', ['$namespaces', ($namespaces) ->

    @_list = []
    @list = () => @_list

    $namespaces.current().tags().then (tags) =>
      @_list = tags
    , _handleAPIError

    @
  ])
