
define ["angular", "jQuery"], (angular) ->
  angular.module('baobab.service.scrollstate', [])
  .service('$scrollState', ['$rootScope', ($rootScope) ->

    @_scrollID = null

    @scrollTo = (id) =>
      @_scrollID = id
      @runScroll()

    @runScroll = () =>
      return unless @_scrollID
      offset = $('#'+@_scrollID).offset()
      return if offset == undefined

      $('body').scrollTop(offset.top)

    # update our scroll offset when components of the view load: angular views,
    # angular partials, and our own (async) iFrames for messages.
    $rootScope.$on('$viewContentLoaded', @runScroll)
    $rootScope.$on('$includeContentLoaded', @runScroll)
    $rootScope.$on('inIframeLoaded', @runScroll)

    # reset the scroll offset when we visit a new route
    $rootScope.$on '$routeChangeStart', () =>
      @_scrollID = null
      $('body').scrollTop(0)

    @
  ])
