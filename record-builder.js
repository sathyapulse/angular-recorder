/**
 * Created by svenkatesan on 3/10/2015.
 */

// Creates recorder module for HTML5 & Flash
angular.module('recorder', []);

angular.module("recorder").factory('recorderUtils', [
    function() {

        // Generates UUID
        var factory = {
            generateUuid: function() {
                function _p8(s) {
                    var p = (Math.random().toString(16) + "000000000").substr(2, 8);
                    return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
                }
                return _p8() + _p8(true) + _p8(true) + _p8();
            }
        };

        return factory;
    }
]);

angular.module('recorder').directive('recordPermissionHandler', [
   function () {
       return {
           restrict: 'EA',
           scope: {
               recordPermissionControl: '='
           },
           template: '<div id="recorder-content"></div>',
           link: function (scope, element, attributes) {
            
               var audioInput = null,
                   realAudioInput = null,
                   inputPoint = null,
                   audioRecorder = null,
                   audioContext = null,
                   flashconfigureMic = function () {
                       if (!FWRecorder.isReady) {
                           return;
                       }
                       FWRecorder.configure(44, 100, 0, 2000);
                       FWRecorder.setUseEchoSuppression(false);
                       FWRecorder.setLoopBack(false);
                   },


                   flashExternalEvents = function(eventName) {
                       //Actions based on user interaction with flash
                       var name;
                       switch (arguments[0]) {
                           case "ready":
                               var width = parseInt(arguments[1]);
                               var height = parseInt(arguments[2]);
                               FWRecorder.connect('recorder-app', 0);
                               FWRecorder.recorderOriginalWidth = 1;
                               FWRecorder.recorderOriginalHeight = 1;
                               scope.recordPermissionControl.isReady = true;
                               scope.recordPermissionControl.recordHandler = FWRecorder;
                               
                               //to store permission in cache when rememebr is checked
                               if(FWRecorder.isMicrophoneAccessible()) {
                                   localStorage.setItem("permission", "given");
                               }
                               else {
                                   localStorage.setItem("permission", false);
                               }

                               break;

                           case "no_microphone_found":
                               break;

                           case "microphone_user_request":
                               FWRecorder.showPermissionWindow({permanent: true});
                               break;

                           case "microphone_connected":
                               if(angular.isDefined(scope.recordPermissionControl.onPermissionAllowed)) {
                                   scope.recordPermissionControl.onPermissionAllowed();
                               }
                               break;

                           case "microphone_not_connected":
                               localStorage.setItem("permission", false);
                               if(angular.isDefined(scope.recordPermissionControl.onPermissionDenied)) {
                                   scope.recordPermissionControl.onPermissionDenied();
                               }
                               break;

                           case "permission_panel_closed":
                               FWRecorder.defaultSize();
                               if(angular.isDefined(scope.recordPermissionControl.onPermissionClosed)) {
                                   scope.recordPermissionControl.onPermissionClosed();
                               }
                               break;

                           case "microphone_activity":
                               break;

                           case "recording":
                               name = arguments[1];
                               FWRecorder.hide();
                               break;

                           case "recording_stopped":
                               name = arguments[1];
                               FWRecorder.hide();
                               break;

                           case "microphone_level":
                               break;

                           case "observing_level":
                               break;

                           case "observing_level_stopped":
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
                       }
                     
                   };
                   
               scope.recordPermissionControl.recordHandler = null;
               scope.recordPermissionControl.isHtml5 = null;
               scope.recordPermissionControl.isReady = false;

               //HTML5 recorder
                   var gotStream = function(stream) {
                       inputPoint = audioContext.createGain();

                       // Create an AudioNode from the stream.
                       realAudioInput = audioContext.createMediaStreamSource(stream);
                       audioInput = realAudioInput;
                       audioInput.connect(inputPoint);

                       analyserNode = audioContext.createAnalyser();
                       analyserNode.fftSize = 2048;
                       inputPoint.connect( analyserNode );

                       audioRecorder = new Recorder( realAudioInput );
                       zeroGain = audioContext.createGain();
                       zeroGain.gain.value = 0.0;
                       inputPoint.connect( zeroGain );
                       zeroGain.connect( audioContext.destination );

                       scope.recordPermissionControl.isReady = true;

                       scope.recordPermissionControl.recordHandler = audioRecorder;

                       if(window.location.protocol == 'https:'){
                           //to store permission for https websites
                           localStorage.setItem("permission", "given");
                       }

                       if(angular.isDefined(scope.recordPermissionControl.onPermissionAllowed)) {
                           scope.recordPermissionControl.onPermissionAllowed();
                       }

                   };

                   var failStream = function (data) {
                       console.log(data);
                       localStorage.setItem("permission", false);
                       if(angular.isDefined(scope.recordPermissionControl.onPermissionDenied)) {
                           scope.recordPermissionControl.onPermissionDenied();
                       }
                   };

               navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
              
               // Checks user media is supported in browser
               if(navigator.getUserMedia) {

                   scope.recordPermissionControl.isHtml5 = true;

                   window.AudioContext = window.AudioContext || window.webkitAudioContext;

                   if(window.AudioContext && !window.audioContextInstance) {
                       window.audioContextInstance = new AudioContext();
                   }
                   audioContext = window.audioContextInstance;

                   if(localStorage.getItem("permission") == "given"){

                      //to get permission from browser cache for returning user
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
                       }, gotStream, failStream);
                   }



               }
               else {
                   //Flash external events initialised when user launches activity
                   window.fwr_event_handler = flashExternalEvents;
                   window.configureMicrophone = flashconfigureMic;

                   //Flash recorder external events
                   scope.recordPermissionControl.isHtml5 = false;

                  //Embedding flash object
                   var params = {};

                   var attrs = {
                       'id': 'recorder-app',
                       'name': 'recorder-app'
                   };

                   var flashvars = {
                       'save_text': ''
                   };

                   var scriptPath = (function(scripts) {
                       var scripts = document.getElementsByTagName('script');

                       for(var i = 0; i < scripts.length; i++) {
                           var script = scripts[i];

                           if (script.getAttribute.length !== undefined) {
                               var scriptIndex = script.src.indexOf('record-builder.js');

                               if(scriptIndex != -1) {
                                   return script.src.slice(0, scriptIndex);
                               }
                           }
                           else {
                               var scriptIndex = script.getAttribute('src', -1).indexOf('record-builder.js');

                               if(scriptIndex != -1) {
                                   return script.getAttribute('src', -1).slice(0, scriptIndex);
                               }
                           }
                       }
                       //to root URL if script path is undefined
                       return '/';
                   }());


                   swfobject.embedSWF( scriptPath + "recorderjs/recorder.swf", "recorder-content", "0", "0", "11.0.0", "", flashvars, params, attrs);

                   
               }

               scope.recordPermissionControl.showPermission = function () {
                   if(scope.recordPermissionControl.isHtml5) {
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
                       }, gotStream, failStream);
                   }
                   else {
                       FWRecorder.showPermissionWindow({permanent: true});
                       //Flash external events called for returning users or using cog icon
                       //window.fwr_event_handler = flashExternalEvents;
                       //window.configureMicrophone = flashconfigureMic;
                   }

               };

           }
       };
   }
]);


// Creates recorder builder
angular.module('recorder').directive('recorderBuilder', [
    'recorderUtils',
    '$timeout',
    function(recorderUtils, $timeout) {

        return {
            restrict: 'EA',
            scope: {
                recordPermissionControl: '=',
                recordControl: '='
            },
            link: function(scope, element, attributes) {
                var currentId = null;
                var cordovaRecorder = null;

                //Gets id of the element in the DOM
                var elementId = element.attr("id");
                
                var fromApp = null;
                //to detect app
                if(window.cordova){
                    fromApp = true;
                }
                else{
                    fromApp = false;
                }

                //Sets ID for the element if ID doesn't exists
                if(!elementId) {
                    elementId = recorderUtils.generateUuid();
                    element.attr("id", elementId);
                }

                scope.isHtml5 = scope.recordPermissionControl.isHtml5;


                scope.getRecordHandler = function() {
                    return scope.recordPermissionControl.recordHandler;
                };

                scope.startRecord = function (id) {
                    var recordHandler = scope.getRecordHandler();
                    //Record iniation based on browser type
                    if(scope.isHtml5 && !fromApp) {
                        //HTML5 recording
                        if (!recordHandler) {
                            return;
                        }
                        recordHandler.clear();
                        recordHandler.record();
                    }
                    else if(fromApp){
                        //mobile app needs wav extension to save recording 
                        var url = 'recorded-audio-'+id+'.wav';
                        cordovaRecorder = new Media(url,scope.cordovaRecordsucess,scope.cordovaRecorderror);
                        cordovaRecorder.startRecord('recorded-audio-'+id);
                    }
                    else {
                        //Flash recording
                        if(!scope.recordPermissionControl.isReady) {
                            //Stop recording if the flash object is not ready
                            return;
                        }

                        recordHandler.record(id, 'audio.wav');

                    }

                    if(angular.isDefined(scope.recordControl.onRecordStart)){
                        scope.recordControl.onRecordStart(id);
                    }
                };

                scope.stopRecord = function (id) {

                    var recordHandler = scope.getRecordHandler();

                    //To stop recording
                    if(scope.isHtml5 && !fromApp) {
                        recordHandler.stop();
                        recordHandler.getBuffers(function(){
                            recordHandler.exportWAV(function(blob){
                                var url = (window.URL || window.webkitURL).createObjectURL(blob);


                                if(document.getElementById('recorded-audio-' + id) == null) {
                                    element.append('<audio src=' + url + ' type="audio/mp3" id="recorded-audio-' + id + '"></audio>');
                                }
                                else {
                                    document.getElementById('recorded-audio-' + id).src = url;
                                }


                                if(angular.isDefined(scope.recordControl.onRecordComplete)) {
                                    scope.recordControl.onRecordComplete(id);
                                }
                            });
                        });
                    }
                    else if(fromApp){
                      cordovaRecorder.stopRecord('recorded-audio-'+id);
                      if(angular.isDefined(scope.recordControl.onRecordComplete)){
                        scope.recordControl.onRecordComplete(id);
                      }
                    }
                    else {
                        recordHandler.stopRecording(id);

                        if(angular.isDefined(scope.recordControl.onRecordComplete)){
                            scope.recordControl.onRecordComplete(id);
                        }

                    }
                };

                scope.playbackRecording = function(id) {

                    var recordHandler = scope.getRecordHandler();

                    //separate play audio function based on browser
                    if(scope.isHtml5 || fromApp) {

                        scope.playbackAudio({
                          id: 'recorded-audio-' + id,
                          onComplete: function() {
                            if(angular.isDefined(scope.recordControl.onPlaybackComplete)){
                                scope.recordControl.onPlaybackComplete(id);
                            }
                          }          
                        });

                    }
                    else {
                        recordHandler.playBack(id);
                        
                        window.fwr_event_handler = function(eventName) {

                            var name;
                            switch (arguments[0]) {
                                case "stopped":
                                    if(angular.isDefined(scope.recordControl.onPlaybackComplete)){
                                        scope.recordControl.onPlaybackComplete(arguments[1]);
                                    }
                                    name = arguments[1];
                                    break;
                            }
                        }
                    }
                };

                scope.playbackAudio = function(audioObject){

                   //to play audio for device and desktop
                   var audioPlayer = document.getElementById(audioObject.id);
                   if(window.cordova){
                      if(audioPlayer){
                        var sourceAudio = audioPlayer.src;
                      }
                      else{
                        //mobile app needs wav extension to play recording
                        var sourceAudio = audioObject.id+'.wav';
                      }

                      var cordovaplayer = new Media(sourceAudio,
                        function() {
                          if(angular.isDefined(audioObject.onComplete)){
                            audioObject.onComplete();
                          }                          
                        });
                      cordovaplayer.play();
                   }
                   else{
                       audioPlayer.play();
                       audioPlayer.addEventListener("ended", function onEnded() {
                         audioPlayer.removeEventListener("ended", onEnded);
                         if(angular.isDefined(audioObject.onComplete)){
                            audioObject.onComplete();
                         }
                       });
                   }
                };

                if(angular.isDefined(scope.recordControl)) {
                  
                    scope.recordControl.startRecord = function (id) {
                        scope.startRecord(id);
                    };

                    scope.recordControl.stopRecord = function (id) {
                        scope.stopRecord(id);
                    };

                    scope.recordControl.isHtml5 = function () {
                        return scope.isHtml5;
                    };

                    scope.recordControl.playbackAudio = function(audioObject){
                        scope.playbackAudio(audioObject);
                    };

                    scope.recordControl.playbackRecording = function (id) {
                        scope.playbackRecording(id);
                    };

                    if(angular.isDefined(scope.recordControl.onReady)) {
                        scope.recordControl.onReady();
                    }
                }

            }
        };
    }
]);
