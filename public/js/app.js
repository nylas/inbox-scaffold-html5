"use strict";
var angular, alert; //globals

var Baobab = angular.module('baobab', [
  'inbox',
  'ngSanitize',
  'ngCookies',
  'ngRoute',
  'ngAnimate',
  'mgcrea.ngStrap.modal',
  'mgcrea.ngStrap.tooltip',
  'mgcrea.ngStrap.popover',
  'infinite-scroll',
  'baobab.controllers'
]).

config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
  $routeProvider.when('/thread/:id', {
    templateUrl: '/partials/thread.html',
    controller: 'ThreadCtrl as ThreadCtrl',
    resolve: {
      "$namespace": function($me) { return $me.namespacePromise; },
    }
  });
  $routeProvider.when('/mail/compose', {
    templateUrl: '/partials/compose-zen.html',
  });
  $routeProvider.when('/:tag', {
    templateUrl: '/partials/thread_list.html',
    controller: 'ThreadListCtrl as ThreadListCtrl'
  });
  $routeProvider.otherwise({redirectTo: '/inbox'});
}]).

config(['$inboxProvider', '$sceDelegateProvider', function($inboxProvider, $sceDelegateProvider) {
  $inboxProvider.
    baseUrl('https://api.inboxapp.com').
    appId('xdfim6g4mbduytzjhn8ud490');

  $sceDelegateProvider.resourceUrlWhitelist([
      'self', $inboxProvider.baseUrl() + "/**"]);
}]);

// Controllers

var BaobabControllers = angular.module('baobab.controllers', ['inbox', 'ngSanitize', 'ngCookies']);

/* Helpers */
var _scope = function (selector) {
  return this.element(document.querySelector(selector)).scope();
};

var _clone = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};

var _displayErrors = true;
window.onbeforeunload = function () {
  _displayErrors = false;
};

var _handleAPIError = function(error) {
  if (!_displayErrors)
    return;
  var msg = "An unexpected error occurred. (HTTP code " + error['status'] + "). Please try again.";
  if (error['message'])
      msg = error['message'];
  alert(msg);
};
