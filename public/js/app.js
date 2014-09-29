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
      templateUrl: '/partials/thread.html',
      controller: 'ThreadCtrl as ThreadCtrl',
      resolve: ['$namespaces-promise']
    });
    $routeProvider.when('/mail/compose', {
      templateUrl: '/partials/compose-zen.html',
      resolve: ['$namespaces-promise']
    });
    $routeProvider.when('/:tag', {
      templateUrl: '/partials/thread_list.html',
      controller: 'ThreadListCtrl as ThreadListCtrl',
      resolve: ['$namespaces-promise']
    });
    $routeProvider.otherwise({redirectTo: '/inbox'});
  }])

  .config(['$inboxProvider', '$sceDelegateProvider', function($inboxProvider, $sceDelegateProvider) {
    $inboxProvider.
    baseUrl('https://api.inboxapp.com').
    appId('xdfim6g4mbduytzjhn8ud490');

    $sceDelegateProvider.resourceUrlWhitelist([
      'self', $inboxProvider.baseUrl() + "/**"]);
  }]);
});



