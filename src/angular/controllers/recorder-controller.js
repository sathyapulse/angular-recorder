'use strict';

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