require.config
  paths:
    "scribe": "/components/scribe/scribe"
    "angular": "/components/angular/angular"
    "angularRoute": "/components/angular-route/angular-route"
    "angularSanitize": "/components/angular-sanitize/angular-sanitize"
    "angularCookies": "/components/angular-cookies/angular-cookies"
    "angularAnimate": "/components/angular-animate/angular-animate"
    "angularStrap": [
      "/components/angular-strap/dist/angular-strap",
      "/components/angular-strap/dist/angular-strap.tpl"
    ]
    "angularMocks": "/components/angular-mocks/angular-mocks"
    "underscore": "/components/underscore/underscore"
    "angularInfiniteScroll": "infinite-scroll"
    "jQuery": "/components/jquery/dist/jquery"
    "Events": "minievents"
    "moment": "/components/moment/min/moment.min"
    "bootstrap": "/components/bootstrap/dist/js/bootstrap.min"

  shim:
    "angular":
      exports: "angular"
      deps: ["jQuery"]
    "angularRoute": ["angular"]
    "angularSanitize": ["angular"]
    "angularCookies": ["angular"]
    "angularAnimate": ["angular"]
    "angularStrap": ["angular", "bootstrap"]
    "angularInfiniteScroll": ["angular", "angularStrap"]
    "angularMocks": ["angular"]
    "bootstrap": ["jQuery"]

# https://code.angularjs.org/1.2.1/docs/guide/bootstrap#overview_deferred-bootstrap
window.name = "NG_DEFER_BOOTSTRAP!"

require ['angular', 'app'], (angular, app) ->
  angular.element(document.querySelector('html')[0]).ready () ->
    angular.resumeBootstrap([app.name])
