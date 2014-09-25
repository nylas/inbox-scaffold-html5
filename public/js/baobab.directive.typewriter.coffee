
define ["angular", "jQuery"], (angular, jquery) ->
  angular.module('baobab.directive.typewriter', [])
  .directive('typewriter', ['$timeout', '$namespaces', ($timeout, $namespaces) ->
    (scope, elem, attr) ->
      ii = 0
      if $('#sounds').length == 0
        $('body').append($('<div id="sounds" style="position:absolute; height:0; overflow:hidden;">\
            <audio src="/sound/key-new-05.mp3" autostart="false" id="key-new-00" enablejavascript="true"></audio>\
            <audio src="/sound/key-new-01.mp3" autostart="false" id="key-new-01" enablejavascript="true"></audio>\
            <audio src="/sound/key-new-02.mp3" autostart="false" id="key-new-02" enablejavascript="true"></audio>\
            <audio src="/sound/key-new-03.mp3" autostart="false" id="key-new-03" enablejavascript="true"></audio>\
            <audio src="/sound/key-new-04.mp3" autostart="false" id="key-new-04" enablejavascript="true"></audio>\
            <audio src="/sound/return-new.mp3" autostart="false" id="return-new" enablejavascript="true"></audio>\
            <audio src="/sound/space-new.mp3" autostart="false" id="space-new" enablejavascript="true"></audio>\
          </div>'))

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
