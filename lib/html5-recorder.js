/*License (MIT)

 Copyright © 2013 Matt Diamond

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 DEALINGS IN THE SOFTWARE.
 */

(function (window) {

  var workerToBlobUrl = function (fn, params) {
    if (typeof fn !== 'function') {
      throw("The specified parameter must be a valid function");
    }
    var fnString = fn.toString();
    if (fnString.match(/\[native\s*code\]/i)) {
      throw("You cannot bind a native function to a worker");
    }
    ;

    params = params || {};
    if (typeof params !== 'object') {
      console.warn('Params must be an object that is serializable with JSON.stringify, specified is: ' + (typeof params));
    }

    var blobURL = URL.createObjectURL(new Blob(['(', fnString, ')(this,', JSON.stringify(params), ')'], {type: 'application/javascript'}));

    return blobURL;
  };

  Function.prototype.toWorker = function (params) {
    var url = workerToBlobUrl(this, params);
    return new Worker(url);
  };

  var RecorderWorker = function (me) {
    var recLength = 0,
      recBuffersL = [],
      recBuffersR = [],
      bits = 16,
      sampleRate;

    me.onmessage = function (e) {
      switch (e.data.command) {
        case 'init':
          init(e.data.config);
          break;
        case 'record':
          record(e.data.buffer);
          break;
        case 'exportWAV':
          exportWAV(e.data.type);
          break;
        case 'getBuffer':
          getBuffer();
          break;
        case 'clear':
          clear();
          break;
      }
    };

    function init(config) {
      sampleRate = config.sampleRate;
    }

    function record(inputBuffer) {
      recBuffersL.push(inputBuffer[0]);
      //recBuffersR.push(inputBuffer[1]);
      recLength += inputBuffer[0].length;
    }

    function exportWAV(type) {
      var bufferL = mergeBuffers(recBuffersL, recLength);
      var dataview = encodeWAV(bufferL);
      var audioBlob = new Blob([dataview], {type: type});

      me.postMessage(audioBlob);
    }

    function getBuffer() {
      var buffers = [];
      buffers.push(mergeBuffers(recBuffersL, recLength));
      buffers.push(mergeBuffers(recBuffersR, recLength));
      me.postMessage(buffers);
    }

    function clear() {
      recLength = 0;
      recBuffersL = [];
      recBuffersR = [];
    }

    function mergeBuffers(recBuffers, recLength) {
      var result = new Float32Array(recLength);
      var offset = 0;
      for (var i = 0; i < recBuffers.length; i++) {
        result.set(recBuffers[i], offset);
        offset += recBuffers[i].length;
      }
      return result;
    }

    //function interleave(inputL, inputR) {
    //  var length = inputL.length + inputR.length;
    //  var result = new Float32Array(length);
    //
    //  var index = 0,
    //    inputIndex = 0;
    //
    //  while (index < length) {
    //    result[index++] = inputL[inputIndex];
    //    result[index++] = inputR[inputIndex];
    //    inputIndex++;
    //  }
    //  return result;
    //}

    function floatTo16BitPCM(output, offset, input) {
      for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      }
    }

    function writeString(view, offset, string) {
      for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    }


    function encodeWAV(samples) {
      var buffer = new ArrayBuffer(44 + samples.length * 2);
      var view = new DataView(buffer);

      /* RIFF identifier */
      writeString(view, 0, 'RIFF');
      /* file length */
      view.setUint32(4, 32 + samples.length * 2, true);
      /* RIFF type */
      writeString(view, 8, 'WAVE');
      /* format chunk identifier */
      writeString(view, 12, 'fmt ');
      /* format chunk length */
      view.setUint32(16, 16, true);
      /* sample format (raw) */
      view.setUint16(20, 1, true);
      /* channel count */
      //view.setUint16(22, 2, true); /*STEREO*/
      view.setUint16(22, 1, true);
      /*MONO*/
      /* sample rate */
      view.setUint32(24, sampleRate, true);
      /* byte rate (sample rate * block align) */
      //view.setUint32(28, sampleRate * 4, true); /*STEREO*/
      view.setUint32(28, sampleRate * 2, true);
      /*MONO*/
      /* block align (channel count * bytes per sample) */
      //view.setUint16(32, 4, true); /*STEREO*/
      view.setUint16(32, 2, true);
      /*MONO*/
      /* bits per sample */
      view.setUint16(34, 16, true);
      /* data chunk identifier */
      writeString(view, 36, 'data');
      /* data chunk length */
      view.setUint32(40, samples.length * 2, true);

      floatTo16BitPCM(view, 44, samples);

      return view;
    }
  };

  var Recorder = function (source, cfg) {
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    this.context = source.context;
    this.node = (this.context.createScriptProcessor ||
    this.context.createJavaScriptNode).call(this.context,
      bufferLen, 2, 2);
    var worker = RecorderWorker.toWorker();
    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate
      }
    });
    var recording = false,
      currCallback;

    this.node.onaudioprocess = function (e) {
      if (!recording) return;
      worker.postMessage({
        command: 'record',
        buffer: [
          e.inputBuffer.getChannelData(0),
        ]
      });
    };

    this.configure = function (cfg) {
      for (var prop in cfg) {
        if (cfg.hasOwnProperty(prop)) {
          config[prop] = cfg[prop];
        }
      }
    };

    this.record = function () {
      recording = true;
    };

    this.stop = function () {
      recording = false;
    };

    this.clear = function () {
      worker.postMessage({command: 'clear'});
    };

    this.getBuffer = function (cb) {
      currCallback = cb || config.callback;
      worker.postMessage({command: 'getBuffer'})
    };

    this.exportWAV = function (cb, type) {
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/wav';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    };

    //Mp3 conversion
    worker.onmessage = function (e) {
      var blob = e.data;
      //console.log("the blob " +  blob + " " + blob.size + " " + blob.type);
      currCallback(blob);
    };


    function Uint8ArrayToFloat32Array(u8a) {
      var f32Buffer = new Float32Array(u8a.length);
      for (var i = 0; i < u8a.length; i++) {
        var value = u8a[i << 1] + (u8a[(i << 1) + 1] << 8);
        if (value >= 0x8000) value |= ~0x7FFF;
        f32Buffer[i] = value / 0x8000;
      }
      return f32Buffer;
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);    //this should not be necessary
  };

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
      mp3Encoder = new lame.Mp3Encoder(wav.channels, wav.sampleRate, config.bitRate || 96);

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
      var preferredConfig = {}, onSuccess, onError
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

  window.Recorder = Recorder;
  window.MP3Converter = MP3Converter;

})(window);
