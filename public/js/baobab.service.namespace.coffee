
define ["angular"], (angular, events) ->
  angular.module('baobab.service.namespace', [])
  .service('$namespaces', ['$inbox', '$auth', ($inbox, $auth) ->
    @_namespaces = []

    @current = () => @_namespaces[0]

    if $auth.token
      @promise = $inbox.namespaces().then (namespaces) =>
        @_namespaces = namespaces
      ,
      (err) ->
        if (window.confirm("/n/ returned no namespaces. Click OK to be\
          logged out, or Cancel if you think this is a temporary issue."))
          $auth.clearToken()
    else
      @promise = Promise.reject("No auth token")

    @
  ])

  .factory('$namespaces-promise', ['$namespaces', ($n) -> $n.promise ])

