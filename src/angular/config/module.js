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
;