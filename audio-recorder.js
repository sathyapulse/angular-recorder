(function () {
  'use strict'

  /**
   * Created by svenkatesan on 3/10/2015.
   * Modified by JTO
   */

// Creates recorder module for HTML5 & Flash
  var ngRecorder = angular.module('angularAudioRecorder', [])
    .constant('recorderScriptUrl', (function () {
      var scripts = document.getElementsByTagName('script');
      var myUrl = scripts[scripts.length - 1].getAttribute('src');
      return myUrl.substr(0, myUrl.lastIndexOf('/') + 1);
    }()));

  ngRecorder.factory('recorderUtils', [
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
        cordovaAudioUrl: function (id) {
          if (!window.cordova) {
            return 'record-audio' + id + '.wav';
          }

          var url = cordova.file.tempDirectory
            || cordova.file.externalApplicationStorageDirectory
            || cordova.file.sharedDirectory;

          url += Date.now() + '_recordedAudio_' + id.replace('/[^A-Za-z0-9_-]+/gi', '-');
          switch (window.cordova.platformId) {
            case 'ios':
              url += '.wav'
              break;

            case 'android':
              url += '.amr';
              break;

            case 'wp':
              url += '.wma';
              break;

            default :
              url += '.mp3';
          }

          return url;
        }
      };

      return factory;
    }
  ]);

  ngRecorder.provider('recorderService', ['recorderScriptUrl',
    function (scriptPath) {
      var handler = null,
        service = {isHtml5: false, isReady: false},
        permissionHandlers = {onDenied: null, onClosed: null, onAllow: null},
        forceSwf = false,
        utils;

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
        allowed: false,
        externalEvents: function (eventName) {
          //Actions based on user interaction with flash
          var name = arguments[1];
          switch (arguments[0]) {
            case "ready":
              var width = parseInt(arguments[1]);
              var height = parseInt(arguments[2]);
              FWRecorder.connect('recorder-app', 0);
              FWRecorder.recorderOriginalWidth = 1;
              FWRecorder.recorderOriginalHeight = 1;
              break;

            case "microphone_user_request":
              FWRecorder.showPermissionWindow({permanent: true});
              break;

            case "microphone_connected":
              console.log('Permission to use MIC granted');
              swfHandlerConfig.allowed = true;
              break;

            case "microphone_not_connected":
              console.log('Permission to use MIC denied');
              swfHandlerConfig.allowed = false;
              break;

            case "permission_panel_closed":
              if (swfHandlerConfig.allowed) {
                swfHandlerConfig.setAllowed();
              } else {
                swfHandlerConfig.setDeclined();
              }
              FWRecorder.defaultSize();
              if (angular.isFunction(permissionHandlers.onClosed)) {
                permissionHandlers.onClosed();
              }
              break;

            case "recording":
              FWRecorder.hide();
              break;

            case "recording_stopped":
              FWRecorder.hide();
              break;

            case "playing":

              break;

            case "playback_started":

              var latency = arguments[2];
              break;

            case "save_pressed":
              FWRecorder.updateForm();
              break;

            case "saving":
              break;

            case "saved":
              var data = $.parseJSON(arguments[2]);
              if (data.saved) {

              } else {

              }
              break;

            case "save_failed":
              var errorMessage = arguments[2];
              break;

            case "save_progress":
              var bytesLoaded = arguments[2];
              var bytesTotal = arguments[3];
              break;

            case "stopped":
            case "playing_paused":
            case "no_microphone_found":
            case "observing_level":
            case "microphone_level":
            case "microphone_activity":
            case "observing_level_stopped":
            default:
              console.log('Event Received: ', arguments);
              break;
          }

        },
        isInstalled: function () {
          return swfobject.getFlashPlayerVersion().major > 0;
        },
        init: function () {
          //Flash recorder external events
          service.isHtml5 = false;
          if (!swfHandlerConfig.isInstalled()) {
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
          };

          swfobject.embedSWF(scriptPath + "lib/recorder.swf", "recorder-content", "0", "0", "11.0.0", "", flashVars, params, attrs);
          //Flash external events initialised when user launches activity
          window.fwr_event_handler = swfHandlerConfig.externalEvents;
          window.configureMicrophone = swfHandlerConfig.configureMic;
        },
        setAllowed: function () {
          service.isReady = true;
          handler = FWRecorder;
          if (angular.isFunction(permissionHandlers.onAllowed)) {
            permissionHandlers.onAllowed();
          }
        },
        setDeclined: function () {
          service.isReady = false;
          handler = null;
          if (angular.isFunction(permissionHandlers.onDenied)) {
            permissionHandlers.onDenied();
          }
        },
        getPermission: function () {
          if (swfHandlerConfig.isAvailable) {
            if (!FWRecorder.isMicrophoneAccessible()) {
              FWRecorder.showPermissionWindow({permanent: true});
            } else {
              swfHandlerConfig.allowed = true;
              setTimeout(function(){
                swfHandlerConfig.setAllowed();
              }, 100);
            }

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


      service.isCordova = false;

      var init = function () {
        if ('cordova' in window) {
          service.isCordova = true;
        } else if (!forceSwf && navigator.getUserMedia) {
          html5HandlerConfig.init();
        } else {
          swfHandlerConfig.init();
        }
      };

      service.isAvailable = function () {
        if(service.isCordova){
          if (!('Media' in window)) {
            throw new Error('The Media plugin for cordova is required for this library, add plugin using "cordova plugin add cordova-plugin-media"');
          }
          return true;
        }

        return service.isHtml5
          || swfHandlerConfig.isInstalled();
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


      return {
        $get: ['recorderUtils',
          function (recorderUtils) {
            utils = recorderUtils;
            init();
            return service;
          }
        ],
        forceSwf: function (value) {
          forceSwf = value;
        }
      };
    }])
  ;


// Creates recorder builder
  ngRecorder.directive('ngAudioRecorder', [
    function () {

      var RecorderController = function (element, service, recorderUtils, $scope, $timeout, $interval) {
        var control = this, cordovaMedia = {
          recorder: null,
          url: null
        }, timing = null;

        control.isAvailable = service.isAvailable();
        var scopeApply = function () {
          if (!$scope.$$phase) {
            try {
              $scope.$apply();
            } catch (e) {

            }
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

        control.isDenied = null;
        control.elapsedTime = 0;

        control.startRecord = function () {
          if (!service.isAvailable()) {
            return;
          }
          var id = control.id;
          var recordHandler = service.getHandler();
          //Record initiation based on browser type
          var start = function () {
            if (service.isCordova) {
              cordovaMedia.url = recorderUtils.cordovaAudioUrl(control.id);
              //mobile app needs wav extension to save recording
              cordovaMedia.recorder = new Media(cordovaMedia.url, function () {
                console.log('Media successfully launched');
              }, function (err) {
                console.log('Media could not be launched' + err.code, err);
              });
              cordovaMedia.recorder.startRecord();
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
            control.elapsedTime = 0;
            timing = $interval(function(){
              ++control.elapsedTime;
            }, 1000);
          };

          if (service.isCordova || recordHandler) {
            start();
          } else if (!control.isDenied) {
            //probably permission was never asked
            service.showPermission({
              onDenied: function () {
                control.isDenied = true;
                $scope.$apply();
              },
              onAllowed: function () {
                control.isDenied = false;
                recordHandler = service.getHandler();
                start();
                scopeApply();
              }
            });
          }

        };

        var displayPlayback = function (blob) {
          var url = (window.URL || window.webkitURL).createObjectURL(blob);
          var audioObjId = 'recorded-audio-' + control.id;
          if (document.getElementById(audioObjId) == null) {
            element.append('<audio src=' + url + ' type="audio/mp3" id="' + audioObjId + '"></audio>');
          } else {
            document.getElementById(audioObjId).src = url;
          }

          var audioPlayer = document.getElementById(audioObjId);
          if (control.showPlayer) {
            audioPlayer.setAttribute('controls', '');
          }
          audioPlayer.addEventListener("ended", function onEnded() {
            control.onPlaybackComplete(control.id);
            console.log('Playing stopped');
            scopeApply();
          });

        };

        control.stopRecord = function () {
          var id = control.id;
          if (!service.isAvailable() || !control.status.isRecording) {
            return false;
          }

          var recordHandler = service.getHandler();
          var completed = function (blob) {
            control.audioModel = blob;
            if (blob) {
              displayPlayback(blob);
            }
            control.status.isRecording = false;
            control.onRecordComplete(id);
            $interval.cancel(timing);
          };

          //To stop recording
          if (service.isCordova) {
            cordovaMedia.recorder.stopRecord();
            completed(null);
            window.resolveLocalFileSystemURL(cordovaMedia.url, function(entry){
              entry.file(function(blob){
                control.audioModel = blob;
                console.log('File resolved: ', blob.size, ' Type: ', blob.type);
                scopeApply();
              });
            }, function(err){
              console.log('Could not retrieve file, error code:', err.code);
            });
          } else if (service.isHtml5) {
            recordHandler.stop();
            recordHandler.getBuffers(function () {
              recordHandler.exportWAV(function (blob) {
                completed(blob);
                scopeApply();
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

          var audioObjId = 'recorded-audio-' + control.id;
          var audioPlayer = document.getElementById(audioObjId);
          if (service.isCordova) {
            var cPlayer = new Media(cordovaMedia.url, function () {
              control.onPlaybackComplete(control.id);
              scopeApply();
            }, function () {
              console.log('Playback failed');
            });
            cPlayer.play();
          } else {
            audioPlayer.play();
          }
          control.onPlaybackStart();
        };

        control.isHtml5 = function () {
          return service.isHtml5;
        };

        if(control.autoStart){
          $timeout(function(){
            control.startRecord();
          }, 1000);
        }

        element.on('$destroy', function(){
          $interval.cancel(timing);
        });

      };

      RecorderController.$inject = ['$element', 'recorderService', 'recorderUtils', '$scope', '$timeout', '$interval'];

      return {
        restrict: 'EA',
        scope: {
          audioModel: '=',
          id: '@',
          onRecordStart: '&',
          onRecordComplete: '&',
          onPlaybackComplete: '&',
          onPlaybackStart: '&',
          showPlayer: '@',
          autoStart: '@'
        },
        controllerAs: 'recorder',
        bindToController: true,
        template: function (element, attrs) {
          return '<div class="audioRecorder">' +
            '<div id="recorder-content"></div>' +
            element.html() +
            '</div>';
        },
        controller: RecorderController
      };
    }
  ]);

})();
