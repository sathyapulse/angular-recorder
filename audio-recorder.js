/**
 * Created by svenkatesan on 3/10/2015.
 * Modified by JTO
 */
(function () {
  'use strict';

  var PLAYBACK = {
    STOPPED: 0,
    PLAYING: 1,
    PAUSED: 2
  };

  window.cancelAnimationFrame = window.cancelAnimationFrame ||
    window.webkitCancelAnimationFrame ||
    window.mozCancelAnimationFrame;

  window.requestAnimationFrame = window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame;

// Creates recorder module for HTML5 & Flash
  var ngRecorder = angular.module('angularAudioRecorder', [])
    .constant('recorderScriptUrl', (function () {
      var scripts = document.getElementsByTagName('script');
      var myUrl = scripts[scripts.length - 1].getAttribute('src');
      var path = myUrl.substr(0, myUrl.lastIndexOf('/') + 1);
      var a = document.createElement('a');
      a.href = path;
      return a.href;
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
        swfUrl = scriptPath + 'lib/recorder.swf',
        utils,
        mp3Covert = false,
        mp3Config = {bitRate: 92, lameJsUrl: scriptPath + 'lib/lame.min.js'}
        ;

      var swfHandlerConfig = {
        isAvailable: false,
        loaded: false,
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
              swfHandlerConfig.loaded = true;
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
              //console.log('Event Received: ', arguments);
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
          //handlers
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
              setTimeout(function () {
                swfHandlerConfig.setAllowed();
              }, 100);
            }

          }
        }
      };


      var html5AudioProps = {
        audioContext: null,
        inputPoint: null,
        audioInput: null,
        audioRecorder: null,
        analyserNode: null
      };

      var html5HandlerConfig = {
        gotStream: function (stream) {
          var audioContext = html5AudioProps.audioContext;
          // Create an AudioNode from the stream.
          html5AudioProps.audioInput = audioContext.createMediaStreamSource(stream);
          html5AudioProps.audioInput.connect((html5AudioProps.inputPoint = audioContext.createGain()));

          //analyser
          html5AudioProps.analyserNode = audioContext.createAnalyser();
          html5AudioProps.analyserNode.fftSize = 2048;
          html5AudioProps.inputPoint.connect(html5AudioProps.analyserNode);
          html5AudioProps.audioRecorder = new Recorder(html5AudioProps.audioInput);

          //create Gain
          var zeroGain = audioContext.createGain();
          zeroGain.gain.value = 0.0;
          html5AudioProps.inputPoint.connect(zeroGain);
          zeroGain.connect(audioContext.destination);

          //service booted
          service.isReady = true;
          handler = html5AudioProps.audioRecorder;

          if (angular.isFunction(permissionHandlers.onAllowed)) {
            if (window.location.protocol == 'https:') {
              //to store permission for https websites
              localStorage.setItem("permission", "given");
            }
            permissionHandlers.onAllowed();
          }

        },
        failStream: function (data) {
          if (angular.isDefined(permissionHandlers.onDenied)) {
            permissionHandlers.onDenied();
          }
        },
        getPermission: function () {
          navigator.getUserMedia({
            "audio": true
          }, html5HandlerConfig.gotStream, html5HandlerConfig.failStream);
        },
        init: function () {
          service.isHtml5 = true;
          var AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext && !html5AudioProps.audioContext) {
            html5AudioProps.audioContext = new AudioContext();
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

      var controllers = {};

      service.controller = function (id) {
        return controllers[id];
      };

      service.getSwfUrl = function () {
        return swfUrl;
      };

      service.setController = function (id, controller) {
        controllers[id] = controller;
      };

      service.isAvailable = function () {
        if (service.isCordova) {
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
        } else {
          swfHandlerConfig.getPermission();
        }
      };

      service.swfIsLoaded = function () {
        return swfHandlerConfig.loaded;
      };

      service.shouldConvertToMp3 = function () {
        return mp3Covert;
      };

      service.getMp3Config = function () {
        return mp3Config;
      };

      service.$html5AudioProps = html5AudioProps;

      var provider = {
        $get: ['recorderUtils',
          function (recorderUtils) {
            utils = recorderUtils;
            init();
            return service;
          }
        ],
        forceSwf: function (value) {
          forceSwf = value;
          return provider;
        },
        setSwfUrl: function (path) {
          swfUrl = path;
          return provider;
        },
        withMp3Conversion: function (bool, config) {
          mp3Covert = !!bool;
          mp3Config = angular.extend(mp3Config, config || {});
          return provider;
        }
      };

      return provider;
    }])
  ;


// Creates recorder builder
  ngRecorder.directive('ngAudioRecorder', ['recorderService', '$timeout',
    function (recorderService, $timeout) {

      var RecorderController = function (element, service, recorderUtils, $scope, $timeout, $interval) {
        //used in NON-Angular Async process
        var scopeApply = function (fn) {
          var phase = $scope.$root.$$phase;
          if (phase !== '$apply' && phase !== '$digest') {
            return $scope.$apply(fn);
          }
        };

        var control = this,
          cordovaMedia = {
            recorder: null,
            url: null,
            player: null
          }, timing = null,
          audioObjId = 'recorded-audio-' + control.id,
          status = {
            isRecording: false,
            playback: PLAYBACK.STOPPED,
            isDenied: null,
            isSwfLoaded: null,
            isConverting: false,
            get isPlaying() {
              return status.playback === PLAYBACK.PLAYING;
            },
            get isStopped() {
              return status.playback === PLAYBACK.STOPPED;
            },
            get isPaused() {
              return status.playback === PLAYBACK.PAUSED;
            }
          },
          shouldConvertToMp3 = angular.isDefined(control.convertMp3) ? !!control.convertMp3 : service.shouldConvertToMp3(),
          mp3Converter = shouldConvertToMp3 ? new MP3Converter(service.getMp3Config()) : null;
        ;


        control.timeLimit = control.timeLimit || 0;
        control.status = createReadOnlyVersion(status);
        control.isAvailable = service.isAvailable();
        control.elapsedTime = 0;
        //Sets ID for the element if ID doesn't exists
        if (!control.id) {
          control.id = recorderUtils.generateUuid();
          element.attr("id", control.id);
        }


        if (!service.isHtml5 && !service.isCordova) {
          status.isSwfLoaded = service.swfIsLoaded();
          $scope.$watch(function () {
            return service.swfIsLoaded();
          }, function (n) {
            status.isSwfLoaded = n;
          });
        }


        //register controller with service
        service.setController(control.id, this);

        var playbackOnEnded = function () {
          status.playback = PLAYBACK.STOPPED;
          control.onPlaybackComplete();
          scopeApply();
        };

        var playbackOnPause = function () {
          status.playback = PLAYBACK.PAUSED;
          control.onPlaybackPause();
        };

        var playbackOnStart = function () {
          status.playback = PLAYBACK.PLAYING;
          control.onPlaybackStart();
        };

        var playbackOnResume = function () {
          status.playback = PLAYBACK.PLAYING;
          control.onPlaybackResume();
        };

        var embedPlayer = function (blob) {
          if (document.getElementById(audioObjId) == null) {
            element.append('<audio type="audio/mp3" id="' + audioObjId + '"></audio>');

            var audioPlayer = document.getElementById(audioObjId);
            if (control.showPlayer) {
              audioPlayer.setAttribute('controls', '');
            }

            audioPlayer.addEventListener("ended", playbackOnEnded);
            audioPlayer.addEventListener("pause", function (e) {
              if (this.duration !== this.currentTime) {
                playbackOnPause();
                scopeApply();
              }
            });


            audioPlayer.addEventListener("playing", function (e) {
              if (status.isPaused) {
                playbackOnResume();
              } else {
                playbackOnStart();
              }
              scopeApply();
            });

          }

          if (blob) {
            blobToDataURL(blob, function (url) {
              document.getElementById(audioObjId).src = url;
            });
          } else {
            document.getElementById(audioObjId).removeAttribute('src');
          }
        };

        var doMp3Conversion = function (blobInput, successCallback) {
          if (mp3Converter) {
            status.isConverting = true;
            mp3Converter.convert(blobInput, function (mp3Blob) {
              status.isConverting = false;
              if (successCallback) {
                successCallback(mp3Blob);
              }
              scopeApply(control.onConversionComplete);
            }, function () {
              status.isConverting = false;
            });
            //call conversion started
            control.onConversionStart();
          }
        };

        control.getAudioPlayer = function () {
          return service.isCordova ? cordovaMedia.player : document.getElementById(audioObjId);
        };


        control.startRecord = function () {
          if (!service.isAvailable()) {
            return;
          }

          if (status.isPlaying) {
            control.playbackPause();
            //indicate that this is not paused.
            status.playback = PLAYBACK.STOPPED;
          }

          //clear audio previously recorded
          control.audioModel = null;

          var id = control.id, recordHandler = service.getHandler();
          //Record initiation based on browser type
          var start = function () {
            if (service.isCordova) {
              cordovaMedia.url = recorderUtils.cordovaAudioUrl(control.id);
              //mobile app needs wav extension to save recording
              cordovaMedia.recorder = new Media(cordovaMedia.url, function () {
                console.log('Media successfully played');
              }, function (err) {
                console.log('Media could not be launched' + err.code, err);
              });
              console.log('CordovaRecording');
              cordovaMedia.recorder.startRecord();
            }
            else if (service.isHtml5) {
              //HTML5 recording
              if (!recordHandler) {
                return;
              }
              console.log('HTML5Recording');
              recordHandler.clear();
              recordHandler.record();
            }
            else {
              //Flash recording
              if (!service.isReady) {
                //Stop recording if the flash object is not ready
                return;
              }
              console.log('FlashRecording');
              recordHandler.record(id, 'audio.wav');
            }

            status.isRecording = true;
            control.onRecordStart();
            control.elapsedTime = 0;
            timing = $interval(function () {
              ++control.elapsedTime;
              if (control.timeLimit && control.timeLimit > 0 && control.elapsedTime >= control.timeLimit) {
                control.stopRecord();
              }
            }, 1000);
          };

          if (service.isCordova || recordHandler) {
            start();
          } else if (!status.isDenied) {
            //probably permission was never asked
            service.showPermission({
              onDenied: function () {
                status.isDenied = true;
                $scope.$apply();
              },
              onAllowed: function () {
                status.isDenied = false;
                recordHandler = service.getHandler();
                start();
                scopeApply();
              }
            });
          }
        };

        control.stopRecord = function () {
          var id = control.id;
          if (!service.isAvailable() || !status.isRecording) {
            return false;
          }

          var recordHandler = service.getHandler();
          var completed = function (blob) {
            $interval.cancel(timing);
            status.isRecording = false;
            var finalize = function (inputBlob) {
              control.audioModel = inputBlob;
              embedPlayer(inputBlob);
            };

            if (shouldConvertToMp3) {
              doMp3Conversion(blob, finalize);
            } else {
              finalize(blob)
            }

            embedPlayer(null);
            control.onRecordComplete();
          };

          //To stop recording
          if (service.isCordova) {
            cordovaMedia.recorder.stopRecord();
            window.resolveLocalFileSystemURL(cordovaMedia.url, function (entry) {
              entry.file(function (blob) {
                completed(blob);
              });
            }, function (err) {
              console.log('Could not retrieve file, error code:', err.code);
            });
          } else if (service.isHtml5) {
            recordHandler.stop();
            recordHandler.getBuffer(function () {
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
          if (status.isPlaying || !service.isAvailable() || status.isRecording || !control.audioModel) {
            return false;
          }

          if (service.isCordova) {
            cordovaMedia.player = new Media(cordovaMedia.url, playbackOnEnded, function () {
              console.log('Playback failed');
            });
            cordovaMedia.player.play();
            playbackOnStart();
          } else {
            control.getAudioPlayer().play();
          }

        };

        control.playbackPause = function () {
          if (!status.isPlaying || !service.isAvailable() || status.isRecording || !control.audioModel) {
            return false;
          }

          control.getAudioPlayer().pause();
          if (service.isCordova) {
            playbackOnPause();
          }
        };

        control.playbackResume = function () {
          if (status.isPlaying || !service.isAvailable() || status.isRecording || !control.audioModel) {
            return false;
          }

          if (status.isPaused) {
            //previously paused, just resume
            control.getAudioPlayer().play();
            if (service.isCordova) {
              playbackOnResume();
            }
          } else {
            control.playbackRecording();
          }

        };


        control.save = function (fileName) {
          if (!service.isAvailable() || status.isRecording || !control.audioModel) {
            return false;
          }

          if (!fileName) {
            fileName = 'audio_recording_' + control.id + (control.audioModel.type.indexOf('mp3') > -1 ? 'mp3' : 'wav');
          }

          var blobUrl = (window.URL || window.webkitURL).createObjectURL(control.audioModel);
          var a = document.createElement('a');
          a.href = blobUrl;
          a.target = '_blank';
          a.download = fileName;
          var click = document.createEvent("Event");
          click.initEvent("click", true, true);
          a.dispatchEvent(click);
        };

        control.isHtml5 = function () {
          return service.isHtml5;
        };

        if (control.autoStart) {
          $timeout(function () {
            control.startRecord();
          }, 1000);
        }

        element.on('$destroy', function () {
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
          onPlaybackPause: '&',
          onPlaybackResume: '&',
          onConversionStart: '&',
          onConversionComplete: '&',
          showPlayer: '=',
          autoStart: '=',
          convertMp3: '=',
          timeLimit: '='
        },
        controllerAs: 'recorder',
        bindToController: true,
        template: function (element, attrs) {
          return '<div class="audioRecorder">' +
            '<div style="width: 250px; margin: 0 auto;"><div id="audioRecorder-fwrecorder"></div></div>' +
            element.html() +
            '</div>';
        },
        controller: RecorderController,
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

  ngRecorder.directive('ngAudioRecorderAnalyzer', ['recorderService',
    function (service) {

      return {
        restrict: 'E',
        require: '^ngAudioRecorder',
        template: '<div ng-if="!hide" class="audioRecorder-analyzer">' +
        '<canvas class="analyzer" width="1200" height="400" style="max-width: 100%;"></canvas>' +
        '</div>',
        link: function (scope, element, attrs, recorder) {
          if (!service.isHtml5) {
            scope.hide = true;
            return;
          }

          var canvasWidth, canvasHeight, rafID, analyserContext, props = service.$html5AudioProps;

          function updateAnalysers(time) {

            if (!analyserContext) {
              var canvas = element.find("canvas")[0];

              if (attrs.width)
                canvas.width = attrs.width;
              if (attrs.height)
                canvas.height = attrs.height;

              canvasWidth = canvas.width;
              canvasHeight = canvas.height;
              analyserContext = canvas.getContext('2d');
            }

            // analyzer draw code here
            {
              var SPACING = 3;
              var BAR_WIDTH = 1;
              var numBars = Math.round(canvasWidth / SPACING);
              var freqByteData = new Uint8Array(props.analyserNode.frequencyBinCount);

              props.analyserNode.getByteFrequencyData(freqByteData);

              analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
              //analyserContext.fillStyle = '#F6D565';
              analyserContext.lineCap = 'round';
              var multiplier = props.analyserNode.frequencyBinCount / numBars;

              // Draw rectangle for each frequency bin.
              for (var i = 0; i < numBars; ++i) {
                var magnitude = 0;
                var offset = Math.floor(i * multiplier);
                // gotta sum/average the block, or we miss narrow-bandwidth spikes
                for (var j = 0; j < multiplier; j++)
                  magnitude += freqByteData[offset + j];
                magnitude = magnitude / multiplier;
                var magnitude2 = freqByteData[i * multiplier];
                if (attrs.waveColor)
                  analyserContext.fillStyle = attrs.waveColor;
                else
                  analyserContext.fillStyle = "hsl( " + Math.round((i * 360) / numBars) + ", 100%, 50%)";
                analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
              }
            }

            rafID = window.requestAnimationFrame(updateAnalysers);
          };

          function cancelAnalyserUpdates() {
            window.cancelAnimationFrame(rafID);
            rafID = null;
          };

          element.on('$destroy', function () {
            cancelAnalyserUpdates();
          });

          recorder.onRecordStart = (function (original) {
            return function () {
              original.apply();
              updateAnalysers();
            };
          })(recorder.onRecordStart);

          appendActionToCallback(recorder, 'onRecordStart', updateAnalysers, 'analyzer');
          appendActionToCallback(recorder, 'onRecordComplete', cancelAnalyserUpdates, 'analyzer');
        }
      };
    }
  ]);

  ngRecorder.directive('ngAudioRecorderWaveView', ['recorderService',
    function (service) {

      return {
        restrict: 'E',
        require: '^ngAudioRecorder',
        link: function (scope, $element, attrs, recorder) {
          if (!window.WaveSurfer) {
            console.warn('WaveSurfer was found.');
          }

          var audioPlayer;
          $element.html('<div class="waveSurfer"></div>');
          var options = angular.extend({container: $element.find('div')[0]}, attrs);
          var waveSurfer = WaveSurfer.create(options);
          waveSurfer.setVolume(0);
          appendActionToCallback(recorder, 'onPlaybackStart|onPlaybackResume', function () {
            waveSurfer.play();
          }, 'waveView');
          appendActionToCallback(recorder, 'onPlaybackComplete|onPlaybackPause', function () {
            waveSurfer.pause();
          }, 'waveView');

          appendActionToCallback(recorder, 'onRecordComplete', function () {
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

  var appendActionToCallback = function (object, callbacks, action, track) {

    callbacks.split(/\|/).forEach(function (callback) {
      if (!angular.isObject(object) || !angular.isFunction(action) || !(callback in object) || !angular.isFunction(object[callback])) {
        throw new Error('One or more parameter supplied is not valid');
      }
      ;

      if (!('$$appendTrackers' in object)) {
        object.$$appendTrackers = [];
      }

      var tracker = callback + '|' + track;
      if (object.$$appendTrackers.indexOf(tracker) > -1) {
        console.log('Already appended: ', tracker);
        return;
      }

      object[callback] = (function (original) {
        return function () {
          //console.trace('Calling Callback : ', tracker);
          original.apply(object, arguments);
          action.apply(object, arguments);
        };
      })(object[callback]);

      object.$$appendTrackers.push(tracker);
    });
  };

  var createReadOnlyVersion = function (object) {
    var obj = {};
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        Object.defineProperty(obj, property, {
          get: (function (a) {
            var p = a;
            return function () {
              return object[p];
            }
          })(property),
          enumerable: true,
          configurable: true
        });
      }
    }
    return obj;
  };

  var blobToDataURL = function (blob, callback) {
    var a = new FileReader();
    a.onload = function (e) {
      callback(e.target.result);
    };
    a.readAsDataURL(blob);
  };


})();
