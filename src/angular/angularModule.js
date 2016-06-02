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