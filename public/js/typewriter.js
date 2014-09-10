"use strict";
var Baobab, $; // globals

Baobab

.directive('typewriter', ['$timeout', '$me', function ($timeout,$me) {
  return function(scope, elem, attr) {
    var ii = 0;
    if ($me.emailAddress() != 'mg@inboxapp.com')
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
