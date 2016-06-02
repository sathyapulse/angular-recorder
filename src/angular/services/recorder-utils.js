'use strict';

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