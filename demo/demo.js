(function(){
  'use strict';
  
  angular.module('recorderDemo', [
    'angularAudioRecorder'
  ])
  .controller('DemoController', function($scope, $timeout){
    console.log("Loaded");

  }).config(function(recorderServiceProvider){
      recorderServiceProvider.forceSwf(false);
    });

})();
