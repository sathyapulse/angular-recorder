'use strict';

angular.module('angularAudioRecorder.directives')
  .directive('ngAudioRecorderWaveView', ['recorderService', 'recorderUtils', '$log',
    function (service, utils, $log) {

      return {
        restrict: 'E',
        require: '^ngAudioRecorder',
        link: function (scope, $element, attrs, recorder) {
          if (!window.WaveSurfer) {
            $log.warn('WaveSurfer was found.');
            return;
          }

          var audioPlayer;
          $element.html('<div class="waveSurfer"></div>');
          var options = angular.extend({container: $element.find('div')[0]}, attrs);
          var waveSurfer = WaveSurfer.create(options);
          waveSurfer.setVolume(0);
          utils.appendActionToCallback(recorder, 'onPlaybackStart|onPlaybackResume', function () {
            waveSurfer.play();
          }, 'waveView');
          utils.appendActionToCallback(recorder, 'onPlaybackComplete|onPlaybackPause', function () {
            waveSurfer.pause();
          }, 'waveView');

          utils.appendActionToCallback(recorder, 'onRecordComplete', function () {
            if (!audioPlayer) {
              audioPlayer = recorder.getAudioPlayer();
              audioPlayer.addEventListener('seeking', function (e) {
                var progress = audioPlayer.currentTime / audioPlayer.duration;
                waveSurfer.seekTo(progress);
              });
            }
          }, 'waveView');


          scope.$watch(function () {
            return recorder.audioModel;
          }, function (newBlob) {
            if (newBlob instanceof Blob) {
              waveSurfer.loadBlob(newBlob);
            }
          });
        }
      };
    }]);