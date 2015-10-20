(function(){
  'use strict';
  
  angular.module('recorderDemo', [
    'recorder'
  ])
  .controller('DemoController', function($scope, $timeout){
    console.log("Loaded");
      $scope.recordPermissionControl = {
        onPermissionAllowed: function(){
          console.log('PermissionAllowed', arguments);
        },
        onPermissionDenied: function(){
          console.log('PermissionDenied', arguments);
        },
        onPermissionClosed: function(){
          console.log('PermissionClosed', arguments);
        }
      };

      $scope.recordControl = {
        onRecordStart : function(){
          console.log('Record Started', arguments);
        },
        onRecordComplete : function(){
          console.log('RecordComplete', arguments);
        },
        onPlaybackComplete : function(){
          console.log('PlaybackComplete', arguments);
        }
      };

      $timeout(function(){
        //$scope.recordPermissionControl.showPermission();
      }, 5000);
  });

})();
