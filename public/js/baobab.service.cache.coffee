
define ["angular", "Events", "underscore", "error"], (angular, Events, _, error) ->
  angular.module("baobab.service.cache", [])
  .service('$cache', ['$namespaces', ($namespaces) ->

    remote = requireNode('remote')
    db = remote.require('./lib/database')

    @store = (filters, threads) =>
      return unless threads instanceof Array
      for thread in threads
        db.store(thread.id, thread.raw())

    @
  ])