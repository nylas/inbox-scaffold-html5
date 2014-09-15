allTestFiles = []
TEST_REGEXP = /spec\.js$/

pathToModule = (path) ->
  path.replace(/^\/base\//, '../../').replace(/\.js$/, '')

Object.keys(window.__karma__.files).forEach (file) ->
  if TEST_REGEXP.test file
    #Normalize paths to RequireJS module names.
    allTestFiles.push pathToModule file

require.config
  baseUrl: '/base/public/js'

  paths:
    "scribe": "/base/bower_components/scribe/scribe"
    "angular": "/base/bower_components/angular/angular"
    "angularRoute": "/base/bower_components/angular-route/angular-route"
    "angularSanitize": "/base/bower_components/angular-sanitize/angular-sanitize"
    "angularCookies": "/base/bower_components/angular-cookies/angular-cookies"
    "angularAnimate": "/base/bower_components/angular-animate/angular-animate"
    "angularStrap": [
      "/base/bower_components/angular-strap/dist/angular-strap",
      "/base/bower_components/angular-strap/dist/angular-strap.tpl"
    ]
    "angularMocks": "/base/bower_components/angular-mocks/angular-mocks"
    "underscore": "/base/bower_components/underscore/underscore"
    "angularInfiniteScroll": "infinite-scroll"
    "jQuery": "/base/bower_components/jquery/dist/jquery"
    "Events": "minievents"
    "moment": "/base/bower_components/moment/min/moment.min"
    "bootstrap": "/base/bower_components/bootstrap/dist/js/bootstrap.min"

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

  deps: allTestFiles

  callback: window.__karma__.start
