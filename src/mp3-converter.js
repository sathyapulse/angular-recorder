(function (win) {
  'use strict';

  var MP3ConversionWorker = function (me, params) {
    //should not reference any variable in parent scope as it will executed in its
    //on isolated scope
    console.log('MP3 conversion worker started.');
    if (typeof lamejs === 'undefined') {
      importScripts(params.lameJsUrl);
    }

    var mp3Encoder, maxSamples = 1152, wav, samples, lame, config, dataBuffer;


    var clearBuffer = function () {
      dataBuffer = [];
    };

    var appendToBuffer = function (mp3Buf) {
      dataBuffer.push(new Int8Array(mp3Buf));
    };


    var init = function (prefConfig) {
      config = prefConfig || {};
      lame = new lamejs();
      clearBuffer();
    };

    var encode = function (arrayBuffer) {
      wav = lame.WavHeader.readHeader(new DataView(arrayBuffer));
      console.log('wave:', wav);
      samples = new Int16Array(arrayBuffer, wav.dataOffset, wav.dataLen / 2);
      mp3Encoder = new lame.Mp3Encoder(wav.channels, wav.sampleRate, config.bitRate || 128);

      var remaining = samples.length;
      for (var i = 0; remaining >= maxSamples; i += maxSamples) {
        var mono = samples.subarray(i, i + maxSamples);
        var mp3buf = mp3Encoder.encodeBuffer(mono);
        appendToBuffer(mp3buf);
        remaining -= maxSamples;
      }
    };

    var finish = function () {
      var mp3buf = mp3Encoder.flush();
      appendToBuffer(mp3buf);
      self.postMessage({cmd: 'end', buf: dataBuffer});
      console.log('done encoding');
      clearBuffer();//free up memory
    };

    me.onmessage = function (e) {
      switch (e.data.cmd) {
        case 'init':
          init(e.data.config);
          break;

        case 'encode':
          encode(e.data.rawInput);
          break;

        case 'finish':
          finish();
          break;
      }
    };
  };

  var SCRIPT_BASE = (function () {
    var scripts = document.getElementsByTagName('script');
    var myUrl = scripts[scripts.length - 1].getAttribute('src');
    var path = myUrl.substr(0, myUrl.lastIndexOf('/') + 1);
    if (path && !path.match(/:\/\//)) {
      var a = document.createElement('a');
      a.href = path;
      return a.href;
    }
    return path;
  }());

  var MP3Converter = function (config) {

    config = config || {};
    config.lameJsUrl = config.lameJsUrl || (SCRIPT_BASE + '/lame.min.js');
    var busy = false;
    var mp3Worker = MP3ConversionWorker.toWorker(config);

    this.isBusy = function () {
      return busy
    };

    this.convert = function (blob) {
      var conversionId = 'conversion_' + Date.now(),
        tag = conversionId + ":"
        ;
      console.log(tag, 'Starting conversion');
      var preferredConfig = {}, onSuccess, onError;
      switch (typeof arguments[1]) {
        case 'object':
          preferredConfig = arguments[1];
          break;
        case 'function':
          onSuccess = arguments[1];
          break;
        default:
          throw "parameter 2 is expected to be an object (config) or function (success callback)"
      }

      if (typeof arguments[2] === 'function') {
        if (onSuccess) {
          onError = arguments[2];
        } else {
          onSuccess = arguments[2];
        }
      }

      if (typeof arguments[3] === 'function' && !onError) {
        onError = arguments[3];
      }

      if (busy) {
        throw ("Another conversion is in progress");
      }

      var initialSize = blob.size,
        fileReader = new FileReader(),
        startTime = Date.now();

      fileReader.onload = function (e) {
        console.log(tag, "Passed to BG process");
        mp3Worker.postMessage({
          cmd: 'init',
          config: preferredConfig
        });

        mp3Worker.postMessage({cmd: 'encode', rawInput: e.target.result});
        mp3Worker.postMessage({cmd: 'finish'});

        mp3Worker.onmessage = function (e) {
          if (e.data.cmd == 'end') {
            console.log(tag, "Done converting to Mp3");
            var mp3Blob = new Blob(e.data.buf, {type: 'audio/mp3'});
            console.log(tag, "Conversion completed in: " + ((Date.now() - startTime) / 1000) + 's');
            var finalSize = mp3Blob.size;
            console.log(tag +
              "Initial size: = " + initialSize + ", " +
              "Final size = " + finalSize
              + ", Reduction: " + Number((100 * (initialSize - finalSize) / initialSize)).toPrecision(4) + "%");

            busy = false;
            if (onSuccess && typeof onSuccess === 'function') {
              onSuccess(mp3Blob);
            }
          }
        };
      };
      busy = true;
      fileReader.readAsArrayBuffer(blob);
    }
  };

  win.MP3Converter = MP3Converter;
})(window);