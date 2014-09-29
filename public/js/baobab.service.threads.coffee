
define ["angular", "Events", "underscore", "error"], (angular, Events, _, error) ->
  angular.module("baobab.service.threads", [])
  .service('$threads', ['$namespaces', ($namespaces) ->
    events = Events # Lint thinks this is a constructor (rightly so)
    events(@)

    @_list = null
    @_listVersion = 0
    @_listPendingParams = {}
    @_listIsCompleteSet = false
    @_filters = {}
    @_page = 0
    @_pageSize = 100

    makeAPIRequest = () =>
      pageSize = @_pageSize
      params = _.extend {}, @_filters, {
        limit: pageSize,
        offset: @_page * pageSize
      }

      # bail if params are identical to the previous request
      return if _.isEqual(params, @_listPendingParams)


      # bail if the last request returned fewer items than requested
      return if @_listIsCompleteSet


      # increment the list verison number so any pending requests with old
      # params will be ignored when they complete.
      @_listVersion += 1
      @_listPendingParams = params
      @setSilentRefreshEnabled(false)

      requested = @_listVersion
      $namespaces.current().threads({}, params).then((threads) =>
        # ignore this response if we've moved on to new params
        return unless @_listVersion == requested

        # if we received fewer items than we requested, this must
        # be the last page in the list
        @_listIsCompleteSet = (threads.length < pageSize)

        threads = threads.concat(@_list) if (@_list)

        @setList(threads)
        @setSilentRefreshEnabled(true)
        @_page += 1

      , error._handleAPIError)


    @reload = () =>
      @_page = 0
      @_listPendingParams = {}
      @_listIsCompleteSet = false
      @setList(null)
      makeAPIRequest()


    @list = () =>
      @_list


    @setList = (list) =>
      if (list)
        list.sort (a, b) ->
          b.lastMessageDate.getTime() - a.lastMessageDate.getTime()

      @_list = list
      @emit('update', @)


    @extendList = () ->
      makeAPIRequest()


    @listIsCompleteSet = () =>
      @_listIsCompleteSet


    @listIsMultiplePages = () =>
      @_page > 1


    @item = (id) =>
      _.find @_list, (t) -> t.id == id


    @itemArchived = (id) =>
      return if @_filters['tag'] == 'archive'
      @setList(_.filter @_list, (t) -> t.id != id)


    @filters = () =>
      @_filters


    @setFilters = (filters) =>
      return if _.isEqual(filters, @_filters)

      for key in filters
        delete filters[key] if (filters[key] == '')

      @_filters = filters
      @reload()


    @appendFilters = (filtersToAppend) =>
      @setFilters(_.extend({}, @_filters, filtersToAppend))
      @reload()


    @silentRefresh = () =>
      params = _.extend {}, @_filters, {
        offset: 0,
        limit: @_page * @_pageSize
      }

      @setSilentRefreshEnabled(false)

      requested = @_listVersion
      $namespaces.current().threads({}, params).then((threads) =>
        # ignore this response if we've moved on to new params
        return unless @_listVersion == requested

        @setList(threads)
        @setSilentRefreshEnabled(true)

      , error._handleAPIError)


    @setSilentRefreshEnabled = (enabled) =>
      clearInterval(@_timer) if @_timer
      @_timer = setInterval(@silentRefresh, 10000) if enabled

    @
  ])
