/**
 * Created by svenkatesan on 3/10/2015.
 */

// Creates recorder module for HTML5 & Flash
angular.module('recorder', []);

angular.module("recorder").factory('recorderUtils', [function() {

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
}]);


// Creates recorder builder
angular.module('recorder').directive('recorderBuilder', ['recorderUtils', function(recorderUtils){

    return {
        restrict: 'EA',
        scope: {
          recordControl: '='
        },
        template: '<div id="recorder-content"></div>',
        link: function(scope, element, attributes) {

            var audioInput = null,
                realAudioInput = null,
                inputPoint = null,
                audioRecorder = null,
                audioContext = null,
                isHtml5 = true,
                currentId = null;

            //Gets id of the element in the DOM
            var elementId = element.attr("id");

            //Sets ID for the element if ID doesn't exists
            if(!elementId) {
                elementId = recorderUtils.generateUuid();
                element.attr("id", elementId);
            }

            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            // Checks user media is supported in browser
            if(navigator.getUserMedia) {

                window.AudioContext = window.AudioContext || window.webkitAudioContext;

                if(window.AudioContext) {
                    audioContext = new AudioContext();
                }

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
                };

                var failStream = function (data) {
                    console.log(data);
                };

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
                //Flash recorder
                isHtml5 = false;

                //Embedding flash object
                var params = {};

                var attrs = {
                    'id': 'recorder-app' + elementId,
                    'name': 'recorder-app' + elementId
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

                }());

                swfobject.embedSWF( scriptPath + "recorderjs/recorder.swf", "recorder-content", "0", "0", "11.0.0", "", flashvars, params, attrs);

                window.microphonePermission = function () {
                    FWRecorder.showPermissionWindow({permanent: true});
                };

                window.configureMicrophone = function () {
                    if (!FWRecorder.isReady) {
                        return;
                    }
                    FWRecorder.configure(44, 100, 0, 2000);
                    FWRecorder.setUseEchoSuppression(false);
                    FWRecorder.setLoopBack(false);
                };

                window.fwr_event_handler = function(eventName) {
                    //Actions based on user interaction with flash
                    var name;
                    switch (arguments[0]) {
                        case "ready":
                            var width = parseInt(arguments[1]);
                            var height = parseInt(arguments[2]);
                            FWRecorder.connect('recorder-app' + elementId, 0);
                            FWRecorder.recorderOriginalWidth = width;
                            FWRecorder.recorderOriginalHeight = height;

                            FWRecorder.showPermissionWindow({permanent: true});

                            break;

                        case "no_microphone_found":
                            break;

                        case "microphone_user_request":
                            FWRecorder.showPermissionWindow({permanent: true});
                            break;

                        case "microphone_connected":
                            FWRecorder.isReady = true;
                            break;

                        case "permission_panel_closed":
                            FWRecorder.defaultSize();
                            break;

                        case "microphone_activity":
                            break;

                        case "recording":
                            name = arguments[1];
                            FWRecorder.hide();
                            break;

                        case "recording_stopped":
                            name = arguments[1];
                            var duration = arguments[2];
                            FWRecorder.show();
                            if(angular.isDefined(scope.internalRecordControl.onRecordComplete)) {
                                scope.internalRecordControl.onRecordComplete(arguments[1]);
                            }
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

                        case "stopped":
                            if(angular.isDefined(scope.internalRecordControl.onPlaybackComplete)){
                                scope.internalRecordControl.onPlaybackComplete(arguments[1]);
                            }
                            name = arguments[1];
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
            }

            scope.isHtml5 = isHtml5;

            scope.internalRecordControl = {};


            var startRecord = function (id) {
                //Record iniation based on browser type
                if(isHtml5) {
                    //HTML5 recording
                    if (!audioRecorder) {
                        return;
                    }
                    audioRecorder.clear();
                    audioRecorder.record();
                }
                else {
                    //Flash recording
                    FWRecorder.record(id, 'audio.wav');
                    if(!FWRecorder.isReady) {
                        //Stop recording if the flash object is not ready
                        return;
                    }
                }

                if(angular.isDefined(scope.internalRecordControl.onRecordStart)){
                    scope.internalRecordControl.onRecordStart(id);
                }
            };

            var stopRecord = function (id) {
                //To stop recording
                if(isHtml5) {
                    audioRecorder.stop();
                    audioRecorder.getBuffers(function(){
                        audioRecorder.exportWAV(function(blob){
                            var url = (window.URL || window.webkitURL).createObjectURL(blob);

                            if(document.getElementById('recorded-audio-' + id) == null) {
                                element.append('<audio src=' + url + ' type="audio/mp3" id="recorded-audio-' + id + '"></audio>');
                            }
                            else {
                                document.getElementById('recorded-audio-' + id).src = url;
                            }


                            if(angular.isDefined(scope.internalRecordControl.onRecordComplete)) {
                                scope.internalRecordControl.onRecordComplete(id);
                            }
                        });
                    });
                }
                else {
                    FWRecorder.stopRecording(id);
                }
            };

            var playbackRecording = function(id) {
                //separate play audio function based on browser
                if(isHtml5) {
                    var playbackElement = document.getElementById('recorded-audio-' + id);
                    playbackElement.play();

                    //To trigger complete function after playback ends
                    playbackElement.addEventListener("ended", function onEnded(){

                    playbackElement.removeEventListener("ended", onEnded);
                        if(angular.isDefined(scope.internalRecordControl.onPlaybackComplete)){
                            scope.internalRecordControl.onPlaybackComplete(id);
                        }
                    });

                }
                else {
                  FWRecorder.playBack(id);
                }
            };
         

            if(angular.isDefined(scope.recordControl)) {
                scope.internalRecordControl = scope.recordControl;

                scope.internalRecordControl.startRecord = function (id) {
                    startRecord(id);
                };

                scope.internalRecordControl.stopRecord = function (id) {
                    stopRecord(id);
                };

                scope.internalRecordControl.isHtml5 = function () {
                    return scope.isHtml5;
                };

                scope.internalRecordControl.playbackRecording = function (id) {
                    playbackRecording(id);
                };
            }

            if(angular.isDefined(scope.recordControl.onReady)) {
                scope.recordControl.onReady();
            }

        }
    };
}]);
