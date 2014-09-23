"use strict";

define ["angular", "jQuery"], (angular, jquery) ->
  angular.module('baobab.directive.typewriter', [])
  .directive('typewriter', ['$timeout', '$namespaces', ($timeout, $namespaces) ->
    (scope, elem, attr) ->
      ii = 0
      return unless $namespaces.current().emailAddress == 'mg@inboxapp.com'

      $('body').on 'keydown', (e) ->
        sound = null
        if e.keyCode == 32
          sound = document.getElementById('space-new')
        else if e.keyCode == 13
          sound = document.getElementById('return-new')
        else if e.keyCode > 32
          sound = document.getElementById('key-new-0'+ii)
          ii = (ii + 1) % 5
        
        if sound
          sound.currentTime = 0
          sound.play()
  ])
