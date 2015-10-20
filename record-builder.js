(function () {
  'use strict'

  /**
   * Created by svenkatesan on 3/10/2015.
   * Modified by JTO
   */

// Creates recorder module for HTML5 & Flash
  angular.module('recorder', []);

  angular.module("recorder")
    .factory('recorderUtils', [
      function () {

        // Generates UUID
        var factory = {
          generateUuid: function () {
            function _p8(s) {
              var p = (Math.random().toString(16) + "000000000").substr(2, 8);
              return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
            }

            return _p8() + _p8(true) + _p8(true) + _p8();
          },
          scriptPath: (function (scripts) {
            var scripts = document.getElementsByTagName('script');
            for (var i = 0; i < scripts.length; i++) {
              var script = scripts[i];
              if (script.getAttribute.length !== undefined) {
                var scriptIndex = script.src.indexOf('record-builder.js');
                if (scriptIndex != -1) {
                  return script.src.slice(0, scriptIndex);
                }
              }
              else {
                var scriptIndex = script.getAttribute('src', -1).indexOf('record-builder.js');

                if (scriptIndex != -1) {
                  return script.getAttribute('src', -1).slice(0, scriptIndex);
                }
              }
            }
            //to root URL if script path is undefined
            return '/';
          }())
        };

        return factory;
      }
    ]);

  angular.module("recorder")
    .factory('recorderService', ['recorderUtils',
      function (recorderUtils) {
        var handler = null,
          service = {
            isHtml5: false,
            isReady: false
          },
          permissionHandlers = {
            onDenied: null,
            onClosed: null,
            onAllow: null
          };

        var swfHandlerConfig = {
          isAvailable: false,
          configureMic: function () {
            if (!FWRecorder.isReady) {
              return;
            }
            FWRecorder.configure(44, 100, 0, 2000);
            FWRecorder.setUseEchoSuppression(false);
            FWRecorder.setLoopBack(false);
          },
          externalEvents: function (eventName) {
            //Actions based on user interaction with flash
            var name;
            switch (arguments[0]) {
              case "ready":
                var width = parseInt(arguments[1]);
                var height = parseInt(arguments[2]);
                FWRecorder.connect('recorder-app', 0);
                FWRecorder.recorderOriginalWidth = 1;
                FWRecorder.recorderOriginalHeight = 1;
                service.isReady = true;
                handler = FWRecorder;
                break;

              case "microphone_user_request":
                FWRecorder.showPermissionWindow({permanent: true});
                break;

              case "microphone_connected":
                if (angular.isFunction(permissionHandlers.onAllowed)) {
                  if (window.location.protocol == 'https:') {
                    //to store permission for https websites
                    localStorage.setItem("permission", "given");
                  }
                  permissionHandlers.onAllowed();
                }
                break;

              case "microphone_not_connected":
                if (angular.isFunction(permissionHandlers.onDenied)) {
                  permissionHandlers.onDenied();
                }
                break;

              case "permission_panel_closed":
                FWRecorder.defaultSize();
                if (angular.isFunction(permissionHandlers.onClosed)) {
                  permissionHandlers.onClosed();
                }
                break;


              case "recording":
                name = arguments[1];
                FWRecorder.hide();
                break;

              case "recording_stopped":
                name = arguments[1];
                FWRecorder.hide();
                break;

              case "playing":
                name = arguments[1];
                break;

              case "playback_started":
                name = arguments[1];
                var latency = arguments[2];
                break;

              case "playing_paused":
                name = arguments[1];
                break;

              case "save_pressed":
                FWRecorder.updateForm();
                break;

              case "saving":
                name = arguments[1];
                break;

              case "saved":
                name = arguments[1];
                var data = $.parseJSON(arguments[2]);
                if (data.saved) {

                } else {

                }
                break;

              case "save_failed":
                name = arguments[1];
                var errorMessage = arguments[2];
                break;

              case "save_progress":
                name = arguments[1];
                var bytesLoaded = arguments[2];
                var bytesTotal = arguments[3];
                break;

              case "no_microphone_found":
              case "observing_level":
              case "microphone_level":
              case "microphone_activity":
              case "observing_level_stopped":
                console.log('Event Received: ' + arguments);
                break;
            }

          },
          init: function () {
            //Flash recorder external events
            service.isHtml5 = false;
            if (!swfobject.hasFlashPlayerVersion()) {
              console.log('Flash is not installed, application cannot be initialized');
              return;
            }
            swfHandlerConfig.isAvailable = true;
            //Embedding flash object
            var params = {}, attrs = {
              'id': 'recorder-app',
              'name': 'recorder-app'
            }, flashVars = {
              'save_text': ''
            }, scriptPath = recorderUtils.scriptPath;

            swfobject.embedSWF(scriptPath + "recorderjs/recorder.swf", "recorder-content", "0", "0", "11.0.0", "", flashVars, params, attrs);
            //Flash external events initialised when user launches activity
            window.fwr_event_handler = swfHandlerConfig.externalEvents;
            window.configureMicrophone = swfHandlerConfig.configureMic;
          },
          getPermission: function () {
            if (swfHandlerConfig.isAvailable) {
              FWRecorder.showPermissionWindow({permanent: true});
              //Flash external events called for returning users or using cog icon
              window.fwr_event_handler = swfHandlerConfig.externalEvents;
              window.configureMicrophone = swfHandlerConfig.configureMic;
            }
          }
        };

        var audioInput = null,
          realAudioInput = null,
          inputPoint = null,
          audioRecorder = null;
        var html5HandlerConfig = {
          audioContextInstance: null,
          gotStream: function (stream) {
            var audioContext = html5HandlerConfig.audioContextInstance;
            inputPoint = audioContext.createGain();
            // Create an AudioNode from the stream.
            realAudioInput = audioContext.createMediaStreamSource(stream);
            audioInput = realAudioInput;
            audioInput.connect(inputPoint);

            //analyser
            var analyserNode = audioContext.createAnalyser();
            analyserNode.fftSize = 2048;
            inputPoint.connect(analyserNode);
            audioRecorder = new Recorder(realAudioInput);
            var zeroGain = audioContext.createGain();
            zeroGain.gain.value = 0.0;
            inputPoint.connect(zeroGain);
            zeroGain.connect(audioContext.destination);

            service.isReady = true;
            handler = audioRecorder;

            if (angular.isFunction(permissionHandlers.onAllowed)) {
              if (window.location.protocol == 'https:') {
                //to store permission for https websites
                localStorage.setItem("permission", "given");
              }
              permissionHandlers.onAllowed();
            }

          },
          failStream: function (data) {
            console.log(data);
            if (angular.isDefined(permissionHandlers.onDenied)) {
              permissionHandlers.onDenied();
            }
          },
          getPermission: function () {
            navigator.getUserMedia({
              "audio": {
                "mandatory": {
                  "googEchoCancellation": "false",
                  "googAutoGainControl": "false",
                  "googNoiseSuppression": "false",
                  "googHighpassFilter": "false"
                },
                "optional": []
              }
            }, html5HandlerConfig.gotStream, html5HandlerConfig.failStream);
          },
          init: function () {
            service.isHtml5 = true;
            var AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext && !html5HandlerConfig.audioContextInstance) {
              html5HandlerConfig.audioContextInstance = new AudioContext();
            }
            if (localStorage.getItem("permission") !== null) {
              //to get permission from browser cache for returning user
              html5HandlerConfig.getPermission();
            }
          }
        };

        navigator.getUserMedia = navigator.getUserMedia
          || navigator.webkitGetUserMedia
          || navigator.mozGetUserMedia;

        // Checks user media is supported in browser
        if (navigator.getUserMedia) {
          html5HandlerConfig.init();
        } else {
          swfHandlerConfig.init();
        }

        service.isAvailable = function () {
          return service.isHtml5 || swfobject.hasFlashPlayerVersion();
        };

        service.getHandler = function () {
          return handler;
        };

        service.showPermission = function (listeners) {
          if (!service.isAvailable()) {
            console.warn("Neither HTML5 nor SWF is supported.");
            return;
          }
          if (listeners) {
            angular.extend(permissionHandlers, listeners);
          }

          if (service.isHtml5) {
            html5HandlerConfig.getPermission();
          }
          else {
            swfHandlerConfig.getPermission();
          }
        };

        return service;
      }])
  ;


// Creates recorder builder
  angular.module('recorder')
    .directive('recorderBuilder', ['$compile',
      function ($compile) {

        var RecorderController = function (element, service, recorderUtils, $scope) {
          var control = this,
            currentId = null,
            cordovaRecorder = null,
            fromApp = !!window.cordova;

          var scopeApply = function () {
            try {
              $scope.$apply();
            } catch (e) {

            }
          };

          //Sets ID for the element if ID doesn't exists
          if (!control.id) {
            control.id = recorderUtils.generateUuid();
            element.attr("id", control.id);
          }

          control.status = {
            isRecording: false
          };

          control.isRecording = function () {
            return control.status.isRecording;
          };

          control.isDenied = false;
          control.playbackOnStop = control.playbackOnStop !== undefined ? control.playbackOnStop : true;


          control.startRecord = function () {

            if (!service.isAvailable()) {
              return;
            }
            var id = control.id;
            var recordHandler = service.getHandler();
            //Record initiation based on browser type
            var start = function () {
              if (fromApp) {
                //mobile app needs wav extension to save recording
                var url = 'recorded-audio-' + id + '.wav';
                cordovaRecorder = new Media(url, control.cordovaRecordsucess, control.cordovaRecorderror);
                cordovaRecorder.startRecord('recorded-audio-' + id);
              }
              else if (service.isHtml5) {
                //HTML5 recording
                if (!recordHandler) {
                  return;
                }
                console.log('HTML5 Recording');
                recordHandler.clear();
                recordHandler.record();
              }
              else {
                //Flash recording
                if (!service.isReady) {
                  //Stop recording if the flash object is not ready
                  return;
                }
                recordHandler.record(id, 'audio.wav');
              }

              control.status.isRecording = true;
              control.onRecordStart(id);
            };

            if (fromApp || recordHandler) {
              start();
              console.log('Started ' + Date.now());
            } else if (!control.isDenied) {
              //probably permission was never asked
              service.showPermission({
                onDenied: function () {
                  control.isDenied = true;
                  $scope.$apply();
                },
                onAllowed: function () {
                  recordHandler = service.getHandler();
                  start();
                  scopeApply();
                }
              });
            }

          };

          control.displayPlayback = function (blob) {
            var url = (window.URL || window.webkitURL).createObjectURL(blob);
            if (document.getElementById('recorded-audio-' + control.id) == null) {
              element.append('<audio controls src=' + url + ' type="audio/mp3" id="recorded-audio-' + control.id + '"></audio>');
            } else {
              document.getElementById('recorded-audio-' + control.id).src = url;
            }
          };

          control.stopRecord = function () {
            var id = control.id;
            if (!service.isAvailable() || !control.status.isRecording) {
              return false;
            }

            var recordHandler = service.getHandler();
            var completed = function (blob) {
              control.audioModel = blob;
              if (control.playbackOnStop || control.playbackOnStop === undefined) {
                control.displayPlayback(blob);
              }
              control.status.isRecording = false;
              control.onRecordComplete(id);
              scopeApply();
            };

            //To stop recording
            if (fromApp) {
              cordovaRecorder.stopRecord('recorded-audio-' + id);
              completed([]);
            }
            else if (service.isHtml5) {
              recordHandler.stop();
              recordHandler.getBuffers(function () {
                recordHandler.exportWAV(function (blob) {
                  completed(blob);
                });
              });
            } else {
              recordHandler.stopRecording(id);
              completed(recordHandler.getBlob(id));
            }
          };

          control.playbackRecording = function () {
            if (!service.isAvailable() || control.status.isRecording || !control.audioModel) {
              return false;
            }

            var id = control.id, recordHandler = service.getHandler();
            //separate play audio function based on browser
            if (service.isHtml5 || fromApp) {
              playbackAudio({
                id: 'recorded-audio-' + id,
                onComplete: function () {
                  control.onPlaybackComplete(id);
                  scopeApply();
                }
              });
            } else {
              recordHandler.playBack(id);
              window.fwr_event_handler = function (eventName) {
                var name;
                switch (arguments[0]) {
                  case "stopped":
                    control.onPlaybackComplete(id);
                    scopeApply();
                    name = arguments[1];
                    break;
                }
              }
            }
          };

          var playbackAudio = function (audioObject) {
            //to play audio for device and desktop
            var audioPlayer = document.getElementById(audioObject.id);
            if (fromApp) {
              if (audioPlayer) {
                var sourceAudio = audioPlayer.src;
              }
              else {
                //mobile app needs wav extension to play recording
                var sourceAudio = audioObject.id + '.wav';
              }

              var cordovaPlayer = new Media(sourceAudio,
                function () {
                  audioObject.onComplete();
                });
              cordovaPlayer.play();
            }
            else {
              audioPlayer.play();
              audioPlayer.addEventListener("ended", function onEnded() {
                audioPlayer.removeEventListener("ended", onEnded);
                audioObject.onComplete();
              });
            }
          };

          control.isHtml5 = function () {
            return service.isHtml5;
          };

          control.onReady();
        };

        RecorderController.$inject = ['$element', 'recorderService', 'recorderUtils', '$scope'];

        return {
          restrict: 'EA',
          scope: {
            audioModel: '=',
            id: '@',
            onRecordStart: '&',
            onRecordComplete: '&',
            onPlaybackComplete: '&',
            onReady: '&',
            playbackOnStop: '@'
          },
          controllerAs: 'record',
          bindToController: true,
          template: function (element, attrs) {
            return '<div class="audioRecorder">'
              + element.html()
              + '</div>';
          },
          controller: RecorderController
        };
      }
    ]);

})();