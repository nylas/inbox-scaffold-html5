define ['angular'], (angular) ->
  angular.module("baobab.controller.app", [])
    .controller('AppCtrl', ['$scope', '$namespaces', '$inbox', '$auth', '$location', '$cookieStore', '$sce', ($scope, $namespaces, $inbox, $auth, $location, $cookieStore, $sce) ->
      window.AppCtrl = @

      @inboxAuthURL = $sce.trustAsResourceUrl('https://www.inboxapp.com/oauth/authorize')
      @inboxClientID = $inbox.appId()
      @inboxRedirectURL = "#{window.location.protocol}//#{window.location.host}/"
      @loginHint = ''

      @clearToken = $auth.clearToken
      @token = () => $auth.token
      
      @namespace = () => $namespaces.current()

      @theme = $cookieStore.get('baobab_theme') || 'light'
      @setTheme = (theme) =>
        @theme = theme
        $cookieStore.put('baobab_theme', theme)


      @toggleTheme = () =>
        @setTheme({light: 'dark', dark: 'light'}[@theme])


      @cssForTab = (path) =>
        if $location.path().indexOf(path) != -1
          'active'
        else
          ''

      @
    ])
