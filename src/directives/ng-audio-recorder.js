'use strict';

angular.module('angularAudioRecorder.directives')
  .directive('ngAudioRecorder', ['recorderService', '$timeout',
    function (recorderService, $timeout) {
      return {
        restrict: 'EA',
        scope: {
          audioModel: '=',
          id: '@',
          onRecordStart: '&',
          onRecordComplete: '&',
          onPlaybackComplete: '&',
          onPlaybackStart: '&',
          onPlaybackPause: '&',
          onPlaybackResume: '&',
          onConversionStart: '&',
          onConversionComplete: '&',
          showPlayer: '=?',
          autoStart: '=?',
          convertMp3: '=?',
          timeLimit: '=?'
        },
        controllerAs: 'recorder',
        bindToController: true,
        template: function (element, attrs) {
          return '<div class="audioRecorder">' +
            '<div style="width: 250px; margin: 0 auto;"><div id="audioRecorder-fwrecorder"></div></div>' +
            element.html() +
            '</div>';
        },
        controller: 'recorderController',
        link: function (scope, element, attrs) {
          $timeout(function () {
            if (recorderService.isAvailable && !(recorderService.isHtml5 || recorderService.isCordova)) {
              var params = {
                'allowscriptaccess': 'always'
              }, attrs = {
                'id': 'recorder-app',
                'name': 'recorder-app'
              }, flashVars = {
                'save_text': ''
              };
              swfobject.embedSWF(recorderService.getSwfUrl(), "audioRecorder-fwrecorder", "0", "0", "11.0.0", "", flashVars, params, attrs);
            }
          }, 100);

        }
      };
    }
  ]);
