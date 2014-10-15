requirejs.config
  paths:
    "scribe": "../components/scribe/scribe"
    "angular": "../components/angular/angular"
    "angularRoute": "../components/angular-route/angular-route"
    "angularSanitize": "../components/angular-sanitize/angular-sanitize"
    "angularCookies": "../components/angular-cookies/angular-cookies"
    "angularAnimate": "../components/angular-animate/angular-animate"
    "angularStrap": [
      "../components/angular-strap/dist/angular-strap",
      "../components/angular-strap/dist/angular-strap.tpl"
    ]
    "angularMocks": "../components/angular-mocks/angular-mocks"
    "underscore": "../components/underscore/underscore"
    "angularInfiniteScroll": "infinite-scroll"
    "jQuery": "../components/jquery/dist/jquery"
    "Events": "minievents"
    "moment": "../components/moment/min/moment.min"
    "bootstrap": "../components/bootstrap/dist/js/bootstrap.min"
    "scribe": "../components/scribe/scribe"
    "dropzone": "../components/dropzone/downloads/dropzone-amd-module.min"
    "blueimp-md5": "../components/blueimp-md5/js/md5.min"

  shim:
    "bindKeys":
      exports:
        "module.exports" # only when module is defined (in Atom shell)
    "infinite-scroll":
      exports:
        "module.exports" # only when module is defined (in Atom shell)
    "jQuery":
      exports:
        "module.exports" # only when module is defined (in Atom shell)
    "moment":
      exports:
        "module.exports" # only when module is defined (in Atom shell)
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

requirejs ['angular', 'app'], (angular, app) ->
  angular.element(document.querySelector('html')[0]).ready () ->
    angular.resumeBootstrap([app.name])
