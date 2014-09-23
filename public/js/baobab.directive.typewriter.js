"use strict";

define(["angular", "jQuery"], function (angular, jquery) {
  angular.module('baobab.directive.typewriter', [])

  .directive('typewriter', ['$timeout', '$namespaces', function ($timeout, $namespaces) {
    return function(scope, elem, attr) {
      var ii = 0;
      if ($namespaces.current().emailAddress != 'mg@inboxapp.com')
        return;

      $('body').on('keydown', function(e) {
        var sound = null;
        if (e.keyCode == 32) {
          sound = document.getElementById('space-new');
        } else if (e.keyCode == 13) {
          sound = document.getElementById('return-new');
        } else if (e.keyCode > 32) {
          sound = document.getElementById('key-new-0'+ii);
          ii = (ii + 1) % 5;
        }
        if (sound) {
          sound.currentTime = 0;
          sound.play();
        }
      });
    };
  }]);
});
