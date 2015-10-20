(function(){
  'use strict';
  
  angular.module('recorderDemo', [
    'recorder'
  ])
  .controller('DemoController', function($scope, $timeout){
    console.log("Loaded");

  }).config(function(recorderServiceProvider){
      recorderServiceProvider.forceSwf(true);
    });

})();
