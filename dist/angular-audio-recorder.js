(function() {
  'use strict';
window.cancelAnimationFrame = window.cancelAnimationFrame ||
  window.webkitCancelAnimationFrame ||
  window.mozCancelAnimationFrame;

window.requestAnimationFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame;

angular.module('angularAudioRecorder', [
  'angularAudioRecorder.config',
  'angularAudioRecorder.services',
  'angularAudioRecorder.controllers',
  'angularAudioRecorder.directives'
]);
angular.module('angularAudioRecorder.controllers', [
  'angularAudioRecorder.config',
  'angularAudioRecorder.services'
]);
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

var RecorderController = function (element, service, recorderUtils, $scope, $timeout, $interval, PLAYBACK) {
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

    var blobUrl = window.URL.createObjectURL(control.audioModel);
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

RecorderController.$inject = ['$element', 'recorderService', 'recorderUtils', '$scope', '$timeout', '$interval', 'recorderPlaybackStatus'];

angular.module('angularAudioRecorder.controllers')
  .controller('recorderController', RecorderController)
;
angular.module('angularAudioRecorder.directives', [
  'angularAudioRecorder.config',
  'angularAudioRecorder.services',
  'angularAudioRecorder.controllers'
]);
angular.module('angularAudioRecorder.directives')
  .directive('ngAudioRecorderAnalyzer', ['recorderService', 'recorderUtils',
    function (service, utils) {

      return {
        restrict: 'E',
        require: '^ngAudioRecorder',
        template: '<div ng-if="!hide" class="audioRecorder-analyzer">' +
        '<canvas class="analyzer" width="1200" height="400" style="max-width: 100%;"></canvas>' +
        '</div>',
        link: link
      };

      var link = function (scope, element, attrs, recorder) {
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
        }

        function cancelAnalyserUpdates() {
          window.cancelAnimationFrame(rafID);
          rafID = null;
        }

        element.on('$destroy', function () {
          cancelAnalyserUpdates();
        });

        recorder.onRecordStart = (function (original) {
          return function () {
            original.apply();
            updateAnalysers();
          };
        })(recorder.onRecordStart);

        utils.appendActionToCallback(recorder, 'onRecordStart', updateAnalysers, 'analyzer');
        utils.appendActionToCallback(recorder, 'onRecordComplete', cancelAnalyserUpdates, 'analyzer');
      }
    }
  ]);
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
angular.module('angularAudioRecorder.services', ['angularAudioRecorder.config']);
angular.module('angularAudioRecorder.services')
  .provider('recorderService', ['recorderScriptUrl',
    function (scriptPath) {
      var handler = null,
        service = {isHtml5: false, isReady: false},
        permissionHandlers = {onDenied: null, onClosed: null, onAllow: null},
        forceSwf = false,
        /*this path is relative to the dist path:*/
        swfUrl = scriptPath + '../lib/recorder.swf',
        utils,
        mp3Covert = false,
        mp3Config = {bitRate: 92, lameJsUrl: scriptPath + '../lib/lame.min.js'}
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
angular.module('angularAudioRecorder.services')
  .factory('recorderUtils', [
    /**
     * @ngdoc service
     * @name recorderUtils
     *
     */
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
              url += '.wav';
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

      factory.appendActionToCallback = function (object, callbacks, action, track) {

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

      return factory;
    }
  ]);
angular.module('angularAudioRecorder.config', [])
  .constant('recorderScriptUrl', (function () {
    var scripts = document.getElementsByTagName('script');
    var myUrl = scripts[scripts.length - 1].getAttribute('src');
    var path = myUrl.substr(0, myUrl.lastIndexOf('/') + 1);
    var a = document.createElement('a');
    a.href = path;
    return a.href;
  }()))
  .constant('recorderPlaybackStatus', {
    STOPPED: 0,
    PLAYING: 1,
    PAUSED: 2
  })
;})();
/*License (MIT)

 Copyright © 2013 Matt Diamond

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 DEALINGS IN THE SOFTWARE.
 */

(function (win) {
  'use strict';

  var workerToBlobUrl = function (fn, params) {
    if (typeof fn !== 'function') {
      throw("The specified parameter must be a valid function");
    }
    var fnString = fn.toString();
    if (fnString.match(/\[native\s*code\]/i)) {
      throw("You cannot bind a native function to a worker");
    }
    ;

    params = params || {};
    if (typeof params !== 'object') {
      console.warn('Params must be an object that is serializable with JSON.stringify, specified is: ' + (typeof params));
    }

    var blobURL = URL.createObjectURL(new Blob(['(', fnString, ')(this,', JSON.stringify(params), ')'], {type: 'application/javascript'}));

    return blobURL;
  };

  Function.prototype.toWorker = function (params) {
    var url = workerToBlobUrl(this, params);
    return new Worker(url);
  };

  var RecorderWorker = function (me) {
    var recLength = 0,
      recBuffersL = [],
      recBuffersR = [],
      bits = 16,
      sampleRate;

    me.onmessage = function (e) {
      switch (e.data.command) {
        case 'init':
          init(e.data.config);
          break;
        case 'record':
          record(e.data.buffer);
          break;
        case 'exportWAV':
          exportWAV(e.data.type);
          break;
        case 'getBuffer':
          getBuffer();
          break;
        case 'clear':
          clear();
          break;
      }
    };

    function init(config) {
      sampleRate = config.sampleRate;
    }

    function record(inputBuffer) {
      recBuffersL.push(inputBuffer[0]);
      //recBuffersR.push(inputBuffer[1]);
      recLength += inputBuffer[0].length;
    }

    function exportWAV(type) {
      var bufferL = mergeBuffers(recBuffersL, recLength);
      var dataview = encodeWAV(bufferL);
      var audioBlob = new Blob([dataview], {type: type});

      me.postMessage(audioBlob);
    }

    function getBuffer() {
      var buffers = [];
      buffers.push(mergeBuffers(recBuffersL, recLength));
      buffers.push(mergeBuffers(recBuffersR, recLength));
      me.postMessage(buffers);
    }

    function clear() {
      recLength = 0;
      recBuffersL = [];
      recBuffersR = [];
    }

    function mergeBuffers(recBuffers, recLength) {
      var result = new Float32Array(recLength);
      var offset = 0;
      for (var i = 0; i < recBuffers.length; i++) {
        result.set(recBuffers[i], offset);
        offset += recBuffers[i].length;
      }
      return result;
    }

    //function interleave(inputL, inputR) {
    //  var length = inputL.length + inputR.length;
    //  var result = new Float32Array(length);
    //
    //  var index = 0,
    //    inputIndex = 0;
    //
    //  while (index < length) {
    //    result[index++] = inputL[inputIndex];
    //    result[index++] = inputR[inputIndex];
    //    inputIndex++;
    //  }
    //  return result;
    //}

    function floatTo16BitPCM(output, offset, input) {
      for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    }

    function writeString(view, offset, string) {
      for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }


    function encodeWAV(samples) {
      var buffer = new ArrayBuffer(44 + samples.length * 2);
      var view = new DataView(buffer);

      /* RIFF identifier */
      writeString(view, 0, 'RIFF');
      /* file length */
      view.setUint32(4, 32 + samples.length * 2, true);
      /* RIFF type */
      writeString(view, 8, 'WAVE');
      /* format chunk identifier */
      writeString(view, 12, 'fmt ');
      /* format chunk length */
      view.setUint32(16, 16, true);
      /* sample format (raw) */
      view.setUint16(20, 1, true);
      /* channel count */
      //view.setUint16(22, 2, true); /*STEREO*/
      view.setUint16(22, 1, true);
      /*MONO*/
      /* sample rate */
      view.setUint32(24, sampleRate, true);
      /* byte rate (sample rate * block align) */
      //view.setUint32(28, sampleRate * 4, true); /*STEREO*/
      view.setUint32(28, sampleRate * 2, true);
      /*MONO*/
      /* block align (channel count * bytes per sample) */
      //view.setUint16(32, 4, true); /*STEREO*/
      view.setUint16(32, 2, true);
      /*MONO*/
      /* bits per sample */
      view.setUint16(34, 16, true);
      /* data chunk identifier */
      writeString(view, 36, 'data');
      /* data chunk length */
      view.setUint32(40, samples.length * 2, true);

      floatTo16BitPCM(view, 44, samples);

      return view;
    }
  };

  var Recorder = function (source, cfg) {
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
    this.context.createJavaScriptNode).call(this.context,
      bufferLen, 2, 2);
    var worker = RecorderWorker.toWorker();
    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate
      }
    });
    var recording = false,
      currCallback;

    this.node.onaudioprocess = function (e) {
      if (!recording) return;
      worker.postMessage({
        command: 'record',
        buffer: [
          e.inputBuffer.getChannelData(0),
        ]
      });
    };

    this.configure = function (cfg) {
      for (var prop in cfg) {
        if (cfg.hasOwnProperty(prop)) {
          config[prop] = cfg[prop];
        }
      }
    };

    this.record = function () {
      recording = true;
    };

    this.stop = function () {
      recording = false;
    };

    this.clear = function () {
      worker.postMessage({command: 'clear'});
    };

    this.getBuffer = function (cb) {
      currCallback = cb || config.callback;
      worker.postMessage({command: 'getBuffer'})
    };

    this.exportWAV = function (cb, type) {
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    };

    //Mp3 conversion
    worker.onmessage = function (e) {
      var blob = e.data;
      //console.log("the blob " +  blob + " " + blob.size + " " + blob.type);
      currCallback(blob);
    };


    function Uint8ArrayToFloat32Array(u8a) {
      var f32Buffer = new Float32Array(u8a.length);
      for (var i = 0; i < u8a.length; i++) {
        var value = u8a[i << 1] + (u8a[(i << 1) + 1] << 8);
        if (value >= 0x8000) value |= ~0x7FFF;
        f32Buffer[i] = value / 0x8000;
      }
      return f32Buffer;
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

  var MP3ConversionWorker = function (me, params) {
    //should not reference any variable in parent scope as it will executed in its
    //on isolated scope
    console.log('MP3 conversion worker started.');
    if (typeof lamejs === 'undefined') {
      importScripts(params.lameJsUrl);
    }

    var mp3Encoder, maxSamples = 1152, wav, samples, lame, config, dataBuffer;


    var clearBuffer = function () {
      dataBuffer = [];
    };

    var appendToBuffer = function (mp3Buf) {
      dataBuffer.push(new Int8Array(mp3Buf));
    };


    var init = function (prefConfig) {
      config = prefConfig || {};
      lame = new lamejs();
      clearBuffer();
    };

    var encode = function (arrayBuffer) {
      wav = lame.WavHeader.readHeader(new DataView(arrayBuffer));
      console.log('wave:', wav);
      samples = new Int16Array(arrayBuffer, wav.dataOffset, wav.dataLen / 2);
      mp3Encoder = new lame.Mp3Encoder(wav.channels, wav.sampleRate, config.bitRate || 96);

      var remaining = samples.length;
      for (var i = 0; remaining >= maxSamples; i += maxSamples) {
        var mono = samples.subarray(i, i + maxSamples);
        var mp3buf = mp3Encoder.encodeBuffer(mono);
        appendToBuffer(mp3buf);
        remaining -= maxSamples;
      }
    };

    var finish = function () {
      var mp3buf = mp3Encoder.flush();
      appendToBuffer(mp3buf);
      self.postMessage({cmd: 'end', buf: dataBuffer});
      console.log('done encoding');
      clearBuffer();//free up memory
    };

    me.onmessage = function (e) {
      switch (e.data.cmd) {
        case 'init':
          init(e.data.config);
          break;

        case 'encode':
          encode(e.data.rawInput);
          break;

        case 'finish':
          finish();
          break;
      }
    };
  };

  var SCRIPT_BASE = (function () {
    var scripts = document.getElementsByTagName('script');
    var myUrl = scripts[scripts.length - 1].getAttribute('src');
    var path = myUrl.substr(0, myUrl.lastIndexOf('/') + 1);
    if (path && !path.match(/:\/\//)) {
      var a = document.createElement('a');
      a.href = path;
      return a.href;
    }
    return path;
  }());

  var MP3Converter = function (config) {

    config = config || {};
    config.lameJsUrl = config.lameJsUrl || (SCRIPT_BASE + '/lame.min.js');
    var busy = false;
    var mp3Worker = MP3ConversionWorker.toWorker(config);

    this.isBusy = function () {
      return busy
    };

    this.convert = function (blob) {
      var conversionId = 'conversion_' + Date.now(),
        tag = conversionId + ":"
        ;
      console.log(tag, 'Starting conversion');
      var preferredConfig = {}, onSuccess, onError
      switch (typeof arguments[1]) {
        case 'object':
          preferredConfig = arguments[1];
          break;
        case 'function':
          onSuccess = arguments[1];
          break;
        default:
          throw "parameter 2 is expected to be an object (config) or function (success callback)"
      }

      if (typeof arguments[2] === 'function') {
        if (onSuccess) {
          onError = arguments[2];
        } else {
          onSuccess = arguments[2];
        }
      }

      if (typeof arguments[3] === 'function' && !onError) {
        onError = arguments[3];
      }

      if (busy) {
        throw ("Another conversion is in progress");
      }

      var initialSize = blob.size,
        fileReader = new FileReader(),
        startTime = Date.now();

      fileReader.onload = function (e) {
        console.log(tag, "Passed to BG process");
        mp3Worker.postMessage({
          cmd: 'init',
          config: preferredConfig
        });

        mp3Worker.postMessage({cmd: 'encode', rawInput: e.target.result});
        mp3Worker.postMessage({cmd: 'finish'});

        mp3Worker.onmessage = function (e) {
          if (e.data.cmd == 'end') {
            console.log(tag, "Done converting to Mp3");
            var mp3Blob = new Blob(e.data.buf, {type: 'audio/mp3'});
            console.log(tag, "Conversion completed in: " + ((Date.now() - startTime) / 1000) + 's');
            var finalSize = mp3Blob.size;
            console.log(tag +
              "Initial size: = " + initialSize + ", " +
              "Final size = " + finalSize
              + ", Reduction: " + Number((100 * (initialSize - finalSize) / initialSize)).toPrecision(4) + "%");

            busy = false;
            if (onSuccess && typeof onSuccess === 'function') {
              onSuccess(mp3Blob);
            }
          }
        };
      };
      busy = true;
      fileReader.readAsArrayBuffer(blob);
    }
  };

  win.Recorder = Recorder;
  win.MP3Converter = MP3Converter;
})(window);

//swfobject.js for flash file inclusion
/*  SWFObject v2.2 <http://code.google.com/p/swfobject/>
 is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
 */
var swfobject = function () {
  var D = "undefined", r = "object", S = "Shockwave Flash", W = "ShockwaveFlash.ShockwaveFlash", q = "application/x-shockwave-flash", R = "SWFObjectExprInst", x = "onreadystatechange", O = window, j = document, t = navigator, T = false, U = [h], o = [], N = [], I = [], l, Q, E, B, J = false, a = false, n, G, m = true, M = function () {
    var aa = typeof j.getElementById != D && typeof j.getElementsByTagName != D && typeof j.createElement != D, ah = t.userAgent.toLowerCase(), Y = t.platform.toLowerCase(), ae = Y ? /win/.test(Y) : /win/.test(ah), ac = Y ? /mac/.test(Y) : /mac/.test(ah), af = /webkit/.test(ah) ? parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, X = !+"\v1", ag = [0, 0, 0], ab = null;
    if (typeof t.plugins != D && typeof t.plugins[S] == r) {
      ab = t.plugins[S].description;
      if (ab && !(typeof t.mimeTypes != D && t.mimeTypes[q] && !t.mimeTypes[q].enabledPlugin)) {
        T = true;
        X = false;
        ab = ab.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
        ag[0] = parseInt(ab.replace(/^(.*)\..*$/, "$1"), 10);
        ag[1] = parseInt(ab.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
        ag[2] = /[a-zA-Z]/.test(ab) ? parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0
      }
    } else {
      if (typeof O.ActiveXObject != D) {
        try {
          var ad = new ActiveXObject(W);
          if (ad) {
            ab = ad.GetVariable("$version");
            if (ab) {
              X = true;
              ab = ab.split(" ")[1].split(",");
              ag = [parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10)]
            }
          }
        } catch (Z) {
        }
      }
    }
    return {w3: aa, pv: ag, wk: af, ie: X, win: ae, mac: ac}
  }(), k = function () {
    if (!M.w3) {
      return
    }
    if ((typeof j.readyState != D && j.readyState == "complete") || (typeof j.readyState == D && (j.getElementsByTagName("body")[0] || j.body))) {
      f()
    }
    if (!J) {
      if (typeof j.addEventListener != D) {
        j.addEventListener("DOMContentLoaded", f, false)
      }
      if (M.ie && M.win) {
        j.attachEvent(x, function () {
          if (j.readyState == "complete") {
            j.detachEvent(x, arguments.callee);
            f()
          }
        });
        if (O == top) {
          (function () {
            if (J) {
              return
            }
            try {
              j.documentElement.doScroll("left")
            } catch (X) {
              setTimeout(arguments.callee, 0);
              return
            }
            f()
          })()
        }
      }
      if (M.wk) {
        (function () {
          if (J) {
            return
          }
          if (!/loaded|complete/.test(j.readyState)) {
            setTimeout(arguments.callee, 0);
            return
          }
          f()
        })()
      }
      s(f)
    }
  }();

  function f() {
    if (J) {
      return
    }
    try {
      var Z = j.getElementsByTagName("body")[0].appendChild(C("span"));
      Z.parentNode.removeChild(Z)
    } catch (aa) {
      return
    }
    J = true;
    var X = U.length;
    for (var Y = 0; Y < X; Y++) {
      U[Y]()
    }
  }

  function K(X) {
    if (J) {
      X()
    } else {
      U[U.length] = X
    }
  }

  function s(Y) {
    if (typeof O.addEventListener != D) {
      O.addEventListener("load", Y, false)
    } else {
      if (typeof j.addEventListener != D) {
        j.addEventListener("load", Y, false)
      } else {
        if (typeof O.attachEvent != D) {
          i(O, "onload", Y)
        } else {
          if (typeof O.onload == "function") {
            var X = O.onload;
            O.onload = function () {
              X();
              Y()
            }
          } else {
            O.onload = Y
          }
        }
      }
    }
  }

  function h() {
    if (T) {
      V()
    } else {
      H()
    }
  }

  function V() {
    var X = j.getElementsByTagName("body")[0];
    var aa = C(r);
    aa.setAttribute("type", q);
    var Z = X.appendChild(aa);
    if (Z) {
      var Y = 0;
      (function () {
        if (typeof Z.GetVariable != D) {
          var ab = Z.GetVariable("$version");
          if (ab) {
            ab = ab.split(" ")[1].split(",");
            M.pv = [parseInt(ab[0], 10), parseInt(ab[1], 10), parseInt(ab[2], 10)]
          }
        } else {
          if (Y < 10) {
            Y++;
            setTimeout(arguments.callee, 10);
            return
          }
        }
        X.removeChild(aa);
        Z = null;
        H()
      })()
    } else {
      H()
    }
  }

  function H() {
    var ag = o.length;
    if (ag > 0) {
      for (var af = 0; af < ag; af++) {
        var Y = o[af].id;
        var ab = o[af].callbackFn;
        var aa = {success: false, id: Y};
        if (M.pv[0] > 0) {
          var ae = c(Y);
          if (ae) {
            if (F(o[af].swfVersion) && !(M.wk && M.wk < 312)) {
              w(Y, true);
              if (ab) {
                aa.success = true;
                aa.ref = z(Y);
                ab(aa)
              }
            } else {
              if (o[af].expressInstall && A()) {
                var ai = {};
                ai.data = o[af].expressInstall;
                ai.width = ae.getAttribute("width") || "0";
                ai.height = ae.getAttribute("height") || "0";
                if (ae.getAttribute("class")) {
                  ai.styleclass = ae.getAttribute("class")
                }
                if (ae.getAttribute("align")) {
                  ai.align = ae.getAttribute("align")
                }
                var ah = {};
                var X = ae.getElementsByTagName("param");
                var ac = X.length;
                for (var ad = 0; ad < ac; ad++) {
                  if (X[ad].getAttribute("name").toLowerCase() != "movie") {
                    ah[X[ad].getAttribute("name")] = X[ad].getAttribute("value")
                  }
                }
                P(ai, ah, Y, ab)
              } else {
                p(ae);
                if (ab) {
                  ab(aa)
                }
              }
            }
          }
        } else {
          w(Y, true);
          if (ab) {
            var Z = z(Y);
            if (Z && typeof Z.SetVariable != D) {
              aa.success = true;
              aa.ref = Z
            }
            ab(aa)
          }
        }
      }
    }
  }

  function z(aa) {
    var X = null;
    var Y = c(aa);
    if (Y && Y.nodeName == "OBJECT") {
      if (typeof Y.SetVariable != D) {
        X = Y
      } else {
        var Z = Y.getElementsByTagName(r)[0];
        if (Z) {
          X = Z
        }
      }
    }
    return X
  }

  function A() {
    return !a && F("6.0.65") && (M.win || M.mac) && !(M.wk && M.wk < 312)
  }

  function P(aa, ab, X, Z) {
    a = true;
    E = Z || null;
    B = {success: false, id: X};
    var ae = c(X);
    if (ae) {
      if (ae.nodeName == "OBJECT") {
        l = g(ae);
        Q = null
      } else {
        l = ae;
        Q = X
      }
      aa.id = R;
      if (typeof aa.width == D || (!/%$/.test(aa.width) && parseInt(aa.width, 10) < 310)) {
        aa.width = "310"
      }
      if (typeof aa.height == D || (!/%$/.test(aa.height) && parseInt(aa.height, 10) < 137)) {
        aa.height = "137"
      }
      j.title = j.title.slice(0, 47) + " - Flash Player Installation";
      var ad = M.ie && M.win ? "ActiveX" : "PlugIn", ac = "MMredirectURL=" + O.location.toString().replace(/&/g, "%26") + "&MMplayerType=" + ad + "&MMdoctitle=" + j.title;
      if (typeof ab.flashvars != D) {
        ab.flashvars += "&" + ac
      } else {
        ab.flashvars = ac
      }
      if (M.ie && M.win && ae.readyState != 4) {
        var Y = C("div");
        X += "SWFObjectNew";
        Y.setAttribute("id", X);
        ae.parentNode.insertBefore(Y, ae);
        ae.style.display = "none";
        (function () {
          if (ae.readyState == 4) {
            ae.parentNode.removeChild(ae)
          } else {
            setTimeout(arguments.callee, 10)
          }
        })()
      }
      u(aa, ab, X)
    }
  }

  function p(Y) {
    if (M.ie && M.win && Y.readyState != 4) {
      var X = C("div");
      Y.parentNode.insertBefore(X, Y);
      X.parentNode.replaceChild(g(Y), X);
      Y.style.display = "none";
      (function () {
        if (Y.readyState == 4) {
          Y.parentNode.removeChild(Y)
        } else {
          setTimeout(arguments.callee, 10)
        }
      })()
    } else {
      Y.parentNode.replaceChild(g(Y), Y)
    }
  }

  function g(ab) {
    var aa = C("div");
    if (M.win && M.ie) {
      aa.innerHTML = ab.innerHTML
    } else {
      var Y = ab.getElementsByTagName(r)[0];
      if (Y) {
        var ad = Y.childNodes;
        if (ad) {
          var X = ad.length;
          for (var Z = 0; Z < X; Z++) {
            if (!(ad[Z].nodeType == 1 && ad[Z].nodeName == "PARAM") && !(ad[Z].nodeType == 8)) {
              aa.appendChild(ad[Z].cloneNode(true))
            }
          }
        }
      }
    }
    return aa
  }

  function u(ai, ag, Y) {
    var X, aa = c(Y);
    if (M.wk && M.wk < 312) {
      return X
    }
    if (aa) {
      if (typeof ai.id == D) {
        ai.id = Y
      }
      if (M.ie && M.win) {
        var ah = "";
        for (var ae in ai) {
          if (ai[ae] != Object.prototype[ae]) {
            if (ae.toLowerCase() == "data") {
              ag.movie = ai[ae]
            } else {
              if (ae.toLowerCase() == "styleclass") {
                ah += ' class="' + ai[ae] + '"'
              } else {
                if (ae.toLowerCase() != "classid") {
                  ah += " " + ae + '="' + ai[ae] + '"'
                }
              }
            }
          }
        }
        var af = "";
        for (var ad in ag) {
          if (ag[ad] != Object.prototype[ad]) {
            af += '<param name="' + ad + '" value="' + ag[ad] + '" />'
          }
        }
        aa.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + ah + ">" + af + "</object>";
        N[N.length] = ai.id;
        X = c(ai.id)
      } else {
        var Z = C(r);
        Z.setAttribute("type", q);
        for (var ac in ai) {
          if (ai[ac] != Object.prototype[ac]) {
            if (ac.toLowerCase() == "styleclass") {
              Z.setAttribute("class", ai[ac])
            } else {
              if (ac.toLowerCase() != "classid") {
                Z.setAttribute(ac, ai[ac])
              }
            }
          }
        }
        for (var ab in ag) {
          if (ag[ab] != Object.prototype[ab] && ab.toLowerCase() != "movie") {
            e(Z, ab, ag[ab])
          }
        }
        aa.parentNode.replaceChild(Z, aa);
        X = Z
      }
    }
    return X
  }

  function e(Z, X, Y) {
    var aa = C("param");
    aa.setAttribute("name", X);
    aa.setAttribute("value", Y);
    Z.appendChild(aa)
  }

  function y(Y) {
    var X = c(Y);
    if (X && X.nodeName == "OBJECT") {
      if (M.ie && M.win) {
        X.style.display = "none";
        (function () {
          if (X.readyState == 4) {
            b(Y)
          } else {
            setTimeout(arguments.callee, 10)
          }
        })()
      } else {
        X.parentNode.removeChild(X)
      }
    }
  }

  function b(Z) {
    var Y = c(Z);
    if (Y) {
      for (var X in Y) {
        if (typeof Y[X] == "function") {
          Y[X] = null
        }
      }
      Y.parentNode.removeChild(Y)
    }
  }

  function c(Z) {
    var X = null;
    try {
      X = j.getElementById(Z)
    } catch (Y) {
    }
    return X
  }

  function C(X) {
    return j.createElement(X)
  }

  function i(Z, X, Y) {
    Z.attachEvent(X, Y);
    I[I.length] = [Z, X, Y]
  }

  function F(Z) {
    var Y = M.pv, X = Z.split(".");
    X[0] = parseInt(X[0], 10);
    X[1] = parseInt(X[1], 10) || 0;
    X[2] = parseInt(X[2], 10) || 0;
    return (Y[0] > X[0] || (Y[0] == X[0] && Y[1] > X[1]) || (Y[0] == X[0] && Y[1] == X[1] && Y[2] >= X[2])) ? true : false
  }

  function v(ac, Y, ad, ab) {
    if (M.ie && M.mac) {
      return
    }
    var aa = j.getElementsByTagName("head")[0];
    if (!aa) {
      return
    }
    var X = (ad && typeof ad == "string") ? ad : "screen";
    if (ab) {
      n = null;
      G = null
    }
    if (!n || G != X) {
      var Z = C("style");
      Z.setAttribute("type", "text/css");
      Z.setAttribute("media", X);
      n = aa.appendChild(Z);
      if (M.ie && M.win && typeof j.styleSheets != D && j.styleSheets.length > 0) {
        n = j.styleSheets[j.styleSheets.length - 1]
      }
      G = X
    }
    if (M.ie && M.win) {
      if (n && typeof n.addRule == r) {
        n.addRule(ac, Y)
      }
    } else {
      if (n && typeof j.createTextNode != D) {
        n.appendChild(j.createTextNode(ac + " {" + Y + "}"))
      }
    }
  }

  function w(Z, X) {
    if (!m) {
      return
    }
    var Y = X ? "visible" : "hidden";
    if (J && c(Z)) {
      c(Z).style.visibility = Y
    } else {
      v("#" + Z, "visibility:" + Y)
    }
  }

  function L(Y) {
    var Z = /[\\\"<>\.;]/;
    var X = Z.exec(Y) != null;
    return X && typeof encodeURIComponent != D ? encodeURIComponent(Y) : Y
  }

  var d = function () {
    if (M.ie && M.win) {
      window.attachEvent("onunload", function () {
        var ac = I.length;
        for (var ab = 0; ab < ac; ab++) {
          I[ab][0].detachEvent(I[ab][1], I[ab][2])
        }
        var Z = N.length;
        for (var aa = 0; aa < Z; aa++) {
          y(N[aa])
        }
        for (var Y in M) {
          M[Y] = null
        }
        M = null;
        for (var X in swfobject) {
          swfobject[X] = null
        }
        swfobject = null
      })
    }
  }();
  return {
    registerObject: function (ab, X, aa, Z) {
      if (M.w3 && ab && X) {
        var Y = {};
        Y.id = ab;
        Y.swfVersion = X;
        Y.expressInstall = aa;
        Y.callbackFn = Z;
        o[o.length] = Y;
        w(ab, false)
      } else {
        if (Z) {
          Z({success: false, id: ab})
        }
      }
    }, getObjectById: function (X) {
      if (M.w3) {
        return z(X)
      }
    }, embedSWF: function (ab, ah, ae, ag, Y, aa, Z, ad, af, ac) {
      var X = {success: false, id: ah};
      if (M.w3 && !(M.wk && M.wk < 312) && ab && ah && ae && ag && Y) {
        w(ah, false);
        K(function () {
          ae += "";
          ag += "";
          var aj = {};
          if (af && typeof af === r) {
            for (var al in af) {
              aj[al] = af[al]
            }
          }
          aj.data = ab;
          aj.width = ae;
          aj.height = ag;
          var am = {};
          if (ad && typeof ad === r) {
            for (var ak in ad) {
              am[ak] = ad[ak]
            }
          }
          if (Z && typeof Z === r) {
            for (var ai in Z) {
              if (typeof am.flashvars != D) {
                am.flashvars += "&" + ai + "=" + Z[ai]
              } else {
                am.flashvars = ai + "=" + Z[ai]
              }
            }
          }
          if (F(Y)) {
            var an = u(aj, am, ah);
            if (aj.id == ah) {
              w(ah, true)
            }
            X.success = true;
            X.ref = an
          } else {
            if (aa && A()) {
              aj.data = aa;
              P(aj, am, ah, ac);
              return
            } else {
              w(ah, true)
            }
          }
          if (ac) {
            ac(X)
          }
        })
      } else {
        if (ac) {
          ac(X)
        }
      }
    }, switchOffAutoHideShow: function () {
      m = false
    }, ua: M, getFlashPlayerVersion: function () {
      return {major: M.pv[0], minor: M.pv[1], release: M.pv[2]}
    }, hasFlashPlayerVersion: F, createSWF: function (Z, Y, X) {
      if (M.w3) {
        return u(Z, Y, X)
      } else {
        return undefined
      }
    }, showExpressInstall: function (Z, aa, X, Y) {
      if (M.w3 && A()) {
        P(Z, aa, X, Y)
      }
    }, removeSWF: function (X) {
      if (M.w3) {
        y(X)
      }
    }, createCSS: function (aa, Z, Y, X) {
      if (M.w3) {
        v(aa, Z, Y, X)
      }
    }, addDomLoadEvent: K, addLoadEvent: s, getQueryParamValue: function (aa) {
      var Z = j.location.search || j.location.hash;
      if (Z) {
        if (/\?/.test(Z)) {
          Z = Z.split("?")[1]
        }
        if (aa == null) {
          return L(Z)
        }
        var Y = Z.split("&");
        for (var X = 0; X < Y.length; X++) {
          if (Y[X].substring(0, Y[X].indexOf("=")) == aa) {
            return L(Y[X].substring((Y[X].indexOf("=") + 1)))
          }
        }
      }
      return ""
    }, expressInstallCallback: function () {
      if (a) {
        var X = c(R);
        if (X && l) {
          X.parentNode.replaceChild(l, X);
          if (Q) {
            w(Q, true);
            if (M.ie && M.win) {
              l.style.display = "block"
            }
          }
          if (E) {
            E(B)
          }
        }
        a = false
      }
    }
  }
}();


(function (global) {
  'use strict';

  var Recorder;

  var RECORDED_AUDIO_TYPE = "audio/wav";

  Recorder = {
    recorder: null,
    recorderOriginalWidth: 0,
    recorderOriginalHeight: 0,
    uploadFormId: null,
    uploadFieldName: null,
    isReady: false,

    connect: function (name, attempts) {
      if (navigator.appName.indexOf("Microsoft") != -1) {
        Recorder.recorder = window[name];
      } else {
        Recorder.recorder = document[name];
      }

      if (attempts >= 40) {
        return;
      }

      // flash app needs time to load and initialize
      if (Recorder.recorder && Recorder.recorder.init) {
        Recorder.recorderOriginalWidth = Recorder.recorder.width;
        Recorder.recorderOriginalHeight = Recorder.recorder.height;
        if (Recorder.uploadFormId && $) {
          var frm = $(Recorder.uploadFormId);
          Recorder.recorder.init(frm.attr('action').toString(), Recorder.uploadFieldName, frm.serializeArray());
        }
        return;
      }

      setTimeout(function () {
        Recorder.connect(name, attempts + 1);
      }, 100);
    },

    playBack: function (name) {
      // TODO: Rename to `playback`
      Recorder.recorder.playBack(name);
    },

    pausePlayBack: function (name) {
      // TODO: Rename to `pausePlayback`
      Recorder.recorder.pausePlayBack(name);
    },

    playBackFrom: function (name, time) {
      // TODO: Rename to `playbackFrom`
      Recorder.recorder.playBackFrom(name, time);
    },

    record: function (name, filename) {
      Recorder.recorder.record(name, filename);
    },

    stopRecording: function () {
      Recorder.recorder.stopRecording();
    },

    stopPlayBack: function () {
      // TODO: Rename to `stopPlayback`
      Recorder.recorder.stopPlayBack();
    },

    observeLevel: function () {
      Recorder.recorder.observeLevel();
    },

    stopObservingLevel: function () {
      Recorder.recorder.stopObservingLevel();
    },

    observeSamples: function () {
      Recorder.recorder.observeSamples();
    },

    stopObservingSamples: function () {
      Recorder.recorder.stopObservingSamples();
    },

    resize: function (width, height) {
      Recorder.recorder.width = width + "px";
      Recorder.recorder.height = height + "px";
    },

    defaultSize: function () {
      Recorder.resize(Recorder.recorderOriginalWidth, Recorder.recorderOriginalHeight);
    },

    show: function () {
      Recorder.recorder.show();
    },

    hide: function () {
      Recorder.recorder.hide();
    },

    duration: function (name) {
      // TODO: rename to `getDuration`
      return Recorder.recorder.duration(name || Recorder.uploadFieldName);
    },

    getBase64: function (name) {
      var data = Recorder.recorder.getBase64(name);
      return 'data:' + RECORDED_AUDIO_TYPE + ';base64,' + data;
    },

    getBlob: function (name) {
      var base64Data = Recorder.getBase64(name).split(',')[1];
      return base64toBlob(base64Data, RECORDED_AUDIO_TYPE);
    },

    getCurrentTime: function (name) {
      return Recorder.recorder.getCurrentTime(name);
    },

    isMicrophoneAccessible: function () {
      return Recorder.recorder.isMicrophoneAccessible();
    },

    updateForm: function () {
      var frm = $(Recorder.uploadFormId);
      Recorder.recorder.update(frm.serializeArray());
    },

    showPermissionWindow: function (options) {
      Recorder.resize(240, 160);
      // need to wait until app is resized before displaying permissions screen
      var permissionCommand = function () {
        if (options && options.permanent) {
          Recorder.recorder.permitPermanently();
        } else {
          Recorder.recorder.permit();
        }
      };
      setTimeout(permissionCommand, 1);
    },

    configure: function (rate, gain, silenceLevel, silenceTimeout) {
      rate = parseInt(rate || 22);
      gain = parseInt(gain || 100);
      silenceLevel = parseInt(silenceLevel || 0);
      silenceTimeout = parseInt(silenceTimeout || 4000);
      switch (rate) {
        case 44:
        case 22:
        case 11:
        case 8:
        case 5:
          break;
        default:
          throw("invalid rate " + rate);
      }

      if (gain < 0 || gain > 100) {
        throw("invalid gain " + gain);
      }

      if (silenceLevel < 0 || silenceLevel > 100) {
        throw("invalid silenceLevel " + silenceLevel);
      }

      if (silenceTimeout < -1) {
        throw("invalid silenceTimeout " + silenceTimeout);
      }

      Recorder.recorder.configure(rate, gain, silenceLevel, silenceTimeout);
    },

    setUseEchoSuppression: function (val) {
      if (typeof(val) != 'boolean') {
        throw("invalid value for setting echo suppression, val: " + val);
      }

      Recorder.recorder.setUseEchoSuppression(val);
    },

    setLoopBack: function (val) {
      if (typeof(val) != 'boolean') {
        throw("invalid value for setting loop back, val: " + val);
      }

      Recorder.recorder.setLoopBack(val);
    }
  };

  function base64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: contentType});
  }


  global.FWRecorder = Recorder;


})(window);