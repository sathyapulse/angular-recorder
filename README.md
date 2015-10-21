# Angular Audio Recorder
This is an AngularJS plugin for recording audio input. The directive uses one of the following internally:
- [Cordova Media Plugin](https://github.com/apache/cordova-plugin-media) when wrapped in a Cordova application.
- HTML5 `navigator.*getUserMedia()` and [RecorderJS](https://github.com/mattdiamond/Recorderjs) when available
- Falls back to [FlashWaveRecorder](https://github.com/michalstocki/FlashWavRecorder) in web browsers that do not support `*getUserMedia()`.

## Installation

To install via Bower, simply do the following:

```bash
bower install angularAudioRecorder
```

**NOTICE:** When using Cordova, the Media plugin is required, see [Cordova Media Plugin](https://github.com/apache/cordova-plugin-media) for details on Installation.

## Demo

See the [demo](demo) directory for a simple demo.

## Usage

The Audio recorder is a directive and it can be used as an attribute or an element (preffered).

The general structure is :

```HTML
<ng-audio-recorder id='audioInput' audio-model='recordedInput'>
  <!-- Start controls, exposed via recorder-->
  <div ng-if="recorder.isAvailable">
    <button ng-click="recorder.startRecord()" type="button" ng-disabled="recorder.status.isRecording">
        Start Record
    </button>
    <button ng-click="recorder.stopRecord()" type="button" ng-disabled="recorder.status.isRecording === false">
        Stop Record
    </button>
    <button ng-click="recorder.playbackRecording()" type="button"
            ng-disabled="recorder.status.isRecording || !recorder.audioModel">
        Play Back
    </button>
  </div>

  <div ng-if="!recorder.isAvailable">
    Message for users when recording is not possible.
  </div>
  <!-- End controls-->
</ng-audio-recorder>
```

## API Reference

The following API are exposed to your application.

### Provider `recorderServiceProvider`

This is the provider for configuring the `recorderService`.

- `recorderServiceProvider.forceSwf(boolean value)`: This method can be used to force the plugin to use SWF for Audio input.

### Service `recorderService`

This service is used internally by the directive, even though it's exposed to your application, there is no guarantee on its behaviour.

- `(boolean) recorderService.isReady`: field indicating the recorder is ready.
- `(boolean) recorderService.isHtml5`: field indicating the recorder is using HTML5 internally.
- `(boolean) recorderService.isCordova`: field indicating the recorder is using Cordova Media.
- `(boolean) recorderService.isAvailable()`: method that indicates if recording is available or not. When this returns false, it implies that none of the methods above could be used to record.
- `(Object) recorderService.getHandler()`: returns the current handler being used internally.
- `recorderService.showPermission(options)`: This method is used to request for user permission to use the Microphone (Flash & HTML5). The options is a list of callbacks to be called for various events:
    * onAllowed: callback to call when user grants permission.
    * onDenied: callback to call when user denies permission.
    * onClosed: callback to call when a user closes the permission window (Flash).

The callbacks do not accept any arguments.

### Directive `ngAudioRecorder`

```html
<ng-audio-recorder attributes...></ng-audio-recorder>
```
This is probably the only component which you will interact with when using this application, it can be used as an element (preffered) or as an attribute. The directive takes in the following attributes:

- `audio-model`: the model within your controller to bind the recorded audio message to. The recorded message is a Blob.
- `id`: A unique identifier for your input.
- `show-player`: Indicates if the audio player should be shown after recording is stopped.
- `auto-start`: indicates if the recording should be started automatically.
- `on-record-start`: callback to call when recording is started.
- `on-record-complete`: callback to call when recording is complete.
- `on-playback-start`: callback to call when playback is started.
- `on-playback-complete`: callback to call when playback is completed.

### Controller `ngAudioRecorderController`

The controller for the `ngAudioRecorder` directive is exposed to your template (within the directive element) as an object `recorder` which can be used to control the recording and the playback.

The controller exposes the following :

- `recorder.startRecording()`: starts audio recording, might request permission if the user is yet to grant permission to the application.
- `recorder.stopRecording()`: stops an ongoing recording and sets the audio model.
- `recorder.playbackRecording()`: Plays the recorded message if available.
- `recorder.save()`: Triggers download of the recorded audio file.
- `(boolean) recorder.status.isRecording`: variable indicating if audio record is in progress.
- `(boolean) recorder.isHtml5()`: indicates if HTML5 recording is being used.
- `(boolean | null) recorder.isDenied`: variable indicating if the permission to use audio device was denied. This is set to `null` when permission is yet to be requested.
- `(long) recorder.elapsedTime` : The total time elapsed so far while recording, updated every second.
- `(boolean) recorder.isAvailable`: variable indicating if audio recording is available.

### Directive `ngAudioRecorderAnalyzer`

```html
<ng-audio-recorder-analyzer></ng-audio-recorder-analyzer>
```
This directive displays audio input analysis during recording, [see here](http://webaudiodemos.appspot.com/AudioRecorder/index.html) for example of what an analyzer looks like.  

Please note this directive is only available in HTML5 mode.

### Directive `ngAudioRecorderWaveView`

```html
<ng-audio-recorder-wave-view attributes></ng-audio-recorder-wave-view>
```
This directive displays the wave form of the recorded audio, [see here](http://webaudiodemos.appspot.com/AudioRecorder/index.html) for example of what an the wave form looks like.  

Please note this directive is only available in HTML5 mode.

The following attributes can be specified:

- `wave-color`: The color of the color of the wave form, defaults to `'silver'`.
- `bar-color`: The color of the current play position bar, defaults to `'green'`
- `bar-width`: The width in space units of the position bar, defaults to 1.


## Credits

 - This Repo was originally forked from https://github.com/sathyapulse/angular-recorder the structural changes were too much, I had to create a new project off it.
 - [RecorderJS](https://github.com/mattdiamond/Recorderjs)
 - [FlashWaveRecorder](https://github.com/michalstocki/FlashWavRecorder)
 - [Cordova Media Plugin](https://github.com/apache/cordova-plugin-media)
 - [Web Audio Demo](https://github.com/cwilso/AudioRecorder) by [Chris Wilson](https://github.com/cwilso)


## License (MIT)

Copyright © 2015

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
