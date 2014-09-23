
require ["angular"], (angular) ->
  angular.module('baobab.service.auth', [])
  .service('$auth', ['$cookieStore', '$location', '$inbox', ($cookieStore, $location, $inbox) ->
    
    @clearToken = () =>
      $cookieStore.remove('inbox_auth_token')
      window.location = '/'


    @readTokenFromCookie = () =>
      try
        @token = $cookieStore.get('inbox_auth_token')
      catch e
        @clearToken()
      !!@token


    @readTokenFromURL = () =>
      search = window.location.search
      tokenStart = search.indexOf('access_token=')
      return if tokenStart == -1    

      tokenStart += ('access_token=').length

      tokenEnd = search.indexOf('&', tokenStart)
      tokenEnd = search.length - tokenStart if tokenEnd == -1

      token = search.substr(tokenStart, tokenEnd)
      $cookieStore.put('inbox_auth_token', token)
      window.location.href = '/'


    @readTokenFromURL() unless @readTokenFromCookie()

    if @token
      $inbox.withCredentials(true)
      $inbox.setRequestHeader('Authorization', 'Basic '+btoa(@token+':'))

    @
  ])
