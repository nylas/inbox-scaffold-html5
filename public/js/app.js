"use strict";

define([
  'angular',
  'angular-inbox',
  'angularRoute',
  'angularSanitize',
  'angularCookies',
  'angularAnimate',
  'angularStrap',
  'angularInfiniteScroll',
  'baobab.controller.app',
  'baobab.controller.threadList',
  'baobab.controller.thread',
  'baobab.controller.compose',
  'baobab.service.namespace',
  'baobab.service.contacts',
  'baobab.service.tags',
  'baobab.service.scrollstate',
  'baobab.service.auth',
  'baobab.service.threads',
  'baobab.directive.inParticipants',
  'baobab.directive.inParticipantBubble',
  'baobab.directive.inBindIframeContents',
  'baobab.directive.hotkeys',
  'baobab.directive.autofocus',
  'baobab.directive.typewriter',
  'baobab.directive.autocomplete',
  'baobab.directive.scribe',
  'baobab.directive.dropzone',
  'baobab.filter',
], function (angular) {

  // Controllers
  angular.module('baobab.controllers', [
    'baobab.controller.threadlist',
    'baobab.controller.thread',
    'baobab.controller.app',
    'baobab.controller.compose'
  ]);

  angular.module('baobab.services', [
    'baobab.service.contacts',
    'baobab.service.namespace',
    'baobab.service.tags',
    'baobab.service.scrollstate',
    'baobab.service.auth',
    'baobab.service.threads',
  ]);

  angular.module('baobab.directives', [
    'baobab.directive.inParticipants',
    'baobab.directive.inBindIframeContents',
    'baobab.directive.inParticipantBubble',
    'baobab.directive.hotkeys',
    'baobab.directive.autofocus',
    'baobab.directive.typewriter',
    'baobab.directive.autocomplete',
    'baobab.directive.scribe',
    'baobab.directive.dropzone',
  ]);

  return angular.module('baobab', [
    'inbox',
    'ngSanitize',
    'ngCookies',
    'ngRoute',
    'ngAnimate',
    'mgcrea.ngStrap.modal',
    'mgcrea.ngStrap.tooltip',
    'mgcrea.ngStrap.popover',
    'infinite-scroll',
    'baobab.controllers',
    'baobab.filter',
    'baobab.services',
    'baobab.directives',
  ])

  .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.when('/thread/:id', {
      templateUrl: 'partials/thread.html',
      controller: 'ThreadCtrl as ThreadCtrl',
      resolve: ['$namespaces-promise']
    });
    $routeProvider.when('/mail/compose', {
      templateUrl: 'partials/compose-zen.html',
      resolve: ['$namespaces-promise']
    });
    $routeProvider.when('/mail/compose/:draft_id', {
      templateUrl: 'partials/compose-zen.html',
      resolve: ['$namespaces-promise']
    });
    $routeProvider.when('/:tag', {
      templateUrl: 'partials/thread_list.html',
      controller: 'ThreadListCtrl as ThreadListCtrl',
      resolve: ['$namespaces-promise']
    });
    $routeProvider.otherwise({redirectTo: '/inbox'});
  }])

  .config(['$inboxProvider', '$sceDelegateProvider', function($inboxProvider, $sceDelegateProvider) {

    // Replace `false` with your Inbox App ID
    var inboxAppID = false;

    // Delete this code once you've added your Inbox App ID
    // ---
    var appIdCookie = 'baobab-app-id=';
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(appIdCookie) != -1)
              inboxAppID = c.substring(appIdCookie.length,c.length);
    }
    if (inboxAppID === false)
    window.location = 'set-app-id.html';
    // ---

    var url = 'https://api.nylas.com';

    if (inboxAppID == "localhost") {
      url = 'http://localhost:5555';
    }

    $inboxProvider.baseUrl(url).appId(inboxAppID);

    $sceDelegateProvider.resourceUrlWhitelist([
      'self', $inboxProvider.baseUrl() + "/**"]);
  }]);
});



