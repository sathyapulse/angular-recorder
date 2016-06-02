# Angular Audio Recorder
This is an AngularJS plugin for recording audio input. The directive uses one of the following internally:
- [Cordova Media Plugin](https://github.com/apache/cordova-plugin-media) when wrapped in a Cordova application.
- HTML5 `navigator.*getUserMedia()` and [RecorderJS](https://github.com/mattdiamond/Recorderjs) when available
- Falls back to [FlashWaveRecorder](https://github.com/michalstocki/FlashWavRecorder) in web browsers that do not support `*getUserMedia()`.

This plugin also has the ability to convert the resulting Wave audio file into MP3. This is made optional for MPEG license reasons.

Wave for the resulting audio is displayed using [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js)

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

```html
<!-- Somewhere on your page -->
<script src="/path/to/angular-recorder/dist/angular-audio-recorder.min.js"></script>
<!--- use if you want wave display !-->
<script src="/path/to/wavesurfer/wavesurfer.min.js"></script>
```

Then add as a dependency to your project:

```JS
angular.module('yourAppName', [
    //include other dependencies
    'angularAudioRecorder'
]);
```

You can configure options using

```JS
angular.module('yourAppName')
      .config(['recorderServiceProvider', function(recorderServiceProvider){
        //configure here
      }]);
```

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

> Please note that TypeScript/Flow type notations are used here for easy comprehension.

The following API are exposed to your application.

### Provider `recorderServiceProvider`

This is the provider for configuring the `recorderService`.

- `recorderServiceProvider.forceSwf(force: boolean) : recorderServiceProvider`: This method can be used to force the plugin to use SWF for Audio input.

- `recorderServiceProvider.setSwfUrl(url: String): recorderServiceProvider`: Sets the URL for the Flash Wave Recorder SWF, should be used only when the SWF is not in the default location.


- `recorderServiceProvider.withMp3Conversion(convert: boolean, config : Object) : recorderServiceProvider`: This tells the service to use MP3 conversion for the resulting audio file. The `convert` variable tells the service to provide conversion, while the config object can be used to specify MP3 conversion properties. The `config` object can contain the following properties.
    - `lameJsUrl : string` : URL path to lame.js, should only be specified it it is not in the lib directory.
    - `bitRate : number`: The [bit rate](https://en.wikipedia.org/wiki/MP3#Bit_rate) of the resulting MP3 file. Must be one of 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256 or 320

### Service `recorderService`

This service is used internally by the directive, even though it's exposed to your application, there is no guarantee on its behavior.

#### Properties
- `recorderService.isReady : boolean`: field indicating the recorder is ready.

- `recorderService.isHtml5 : boolean`: field indicating the recorder is using HTML5 internally.

- `recorderService.isCordova : boolean`: field indicating the recorder is using Cordova Media.

#### Methods
- `recorderService.isAvailable() : boolean`: method that indicates if recording is available or not. When this returns false, it implies that none of the methods above could be used to record.

- `recorderService.getHandler() : Object`: returns the current handler being used internally.

- `recorderService.showPermission(options : Object)`: This method is used to request for user permission to use the Microphone (Flash & HTML5). The options is a list of callbacks to be called for various events:
    * onAllowed: callback to call when user grants permission.
    * onDenied: callback to call when user denies permission.
    * onClosed: callback to call when a user closes the permission window (Flash).
The callbacks do not accept any arguments.

- `recorderService.controller(id : sting) : ngAudioRecorderController`: returns the controller for the recorder with the specified ID. The ID is the ID attribute of the element with the `ng-audio-recorder` directive on it.
- `recorderService.getMp3Config() : Object`: returns the MP3 conversion configuration.
- `recorderService.shouldConvertToMp3() : boolean` : indicates if the output will be converted to MP3
- `recorderService.swfIsLoaded() : boolean` : indicates if SWF has been loaded, useful when in SWF mode.

### Directive `ngAudioRecorder`

```html
<ng-audio-recorder attributes...></ng-audio-recorder>
```
This is probably the only component which you will interact with when using this application, it can be used as an element (preffered) or as an attribute. The directive takes in the following attributes:

- `audio-model`: the model within your controller to bind the recorded audio message to. The recorded message is a Blob.
- `id`: A unique identifier for your input.
- `show-player`: Indicates if the audio player should be shown after recording is stopped.
- `auto-start`: indicates if the recording should be started automatically.
- `on-record-start`: callback to execute when recording is started.
- `on-record-complete`: callback to execute when recording is complete.
- `on-playback-start`: callback to execute when playback is started.
- `on-playback-complete`: callback to execute when playback is completed.
- `on-playback-pause`: callback to execute when playback is paused.
- `on-playback-resume`: callback to execute when playback is resumed after pausing.
- `on-conversion-start`: callback to execute when MP3 conversion starts.
- `on-conversion-complete`: callback to execute when MP3 conversion is completed
- `convert-mp3`: Specifies if MP3 conversion should be done for this particular element, it overrides whatever was specified for `recorderServiceProvider.withMp3Conversion()`
- `time-limit` (Number): specifes the time limit for the audio input, the recording will be automatically stopped when this limit is reached. Must be a number greater than 0.

### Controller `ngAudioRecorderController`

The controller for the `ngAudioRecorder` directive is exposed to your template (within the directive element) as an object `recorder` which can be used to control the recording and the playback.

The controller exposes the following :

#### Properties
- `recorder.status : object`: A read-only object with status of the record controller. The fields in the status object are:
    - `isRecording : boolean`: variable indicating if audio record is in progress.
    - `isDenied : boolean`: variable indicating if the permission to use audio device was denied. This is set to `null` when permission is yet to be requested.
    - `isPlaying : boolean`: variable indicating if playback is in progress.
    - `isPaused : boolean`: variable indicating if playback is in Paused.
    - `isStopped : boolean`: variable indicating if playback has ended or stopped.
    - `isConverting : boolean`: variable indicating if conversion is ongoing.
    - `playback : number`: variable indicating status of playback (0 = stopped, 1 = playing, 2 = paused).

- `recorder.isAvailable : boolean`: variable indicating if audio recording is available.
- `recorder.elapsedTime : number` : The total time elapsed so far while recording, updated every second.

#### Methods
- `recorder.isHtml5() : boolean`: indicates if HTML5 recording is being used.
- `recorder.getAudioPlayer() : (Media | HTMLAudioElement)`: returns the underlying audio player.
- `recorder.startRecording() : void`: starts audio recording, might request permission if the user is yet to grant permission to the application.
- `recorder.stopRecording() : void`: stops an ongoing recording and sets the audio model.
- `recorder.playbackRecording() : void`: Plays the recorded message if available.
- `recorder.playbackPause() : void`: Pauses the playback of recorded message.
- `recorder.playbackResume() : void`: Resumes a paused playback of recorded message.
- `recorder.save(fileName : string) : void`: Triggers download of the recorded audio file. If `fileName` is specified, it will be used for as the name of the download file.


### Directive `ngAudioRecorderAnalyzer`

```html
<ng-audio-recorder-analyzer></ng-audio-recorder-analyzer>
```
This directive displays audio input analysis during recording, [see here](http://webaudiodemos.appspot.com/AudioRecorder/index.html) for example of what an analyzer looks like.  

*Please note this directive is only available in HTML5 mode.*

This directive can take in any of the following attributes:

- `width`: A number specifying the width of the analyzer graph in pixels, defaults to `1200`.
- `height`: A number specifying the height of the analyzer graph in pixels, defaults to `400`
- `wave-color`: color of the analyzer graph. Leave this as blank if you want colors to vary with pitch.

### Directive `ngAudioRecorderWaveView`

```html
<ng-audio-recorder-wave-view attributes></ng-audio-recorder-wave-view>
```

This directive displays the waveform of the recorded audio, using [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js)

The options for initializing the WaveSurfer object can be passed in as attributes of the `ng-audio-recorder-wave-view`.

For details of the options available when initializing WaveSurfer, [see here](https://github.com/katspaugh/wavesurfer.js/blob/master/README.md#user-content-wavesurfer-options)

Since attributes passed to AngularJS directives are normalized, you should pass the options as dash delimited, as an example `barWidth` should be passed `bar-width`.


## Credits

 - This Repo was originally forked from https://github.com/sathyapulse/angular-recorder the structural changes were too much, I had to create a new project off it.
 - [RecorderJS](https://github.com/mattdiamond/Recorderjs)
 - [This article for RecordMp3Js] (http://audior.ec/blog/recording-mp3-using-only-html5-and-javascript-recordmp3-js/)
 - [LameJS](https://github.com/zhuker/lamejs)
 - [FlashWaveRecorder](https://github.com/michalstocki/FlashWavRecorder)
 - [Cordova Media Plugin](https://github.com/apache/cordova-plugin-media)
 - [Web Audio Demo](https://github.com/cwilso/AudioRecorder) by [Chris Wilson](https://github.com/cwilso)
 - [WaveSurfer.js] (https://github.com/katspaugh/wavesurfer.js)


## License (MIT)

Copyright © 2015

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
