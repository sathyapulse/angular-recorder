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
        case 'exportMonoWAV':
          exportMonoWAV(e.data.type);
          break;
        case 'getBuffers':
          getBuffers();
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
      recBuffersR.push(inputBuffer[1]);
      recLength += inputBuffer[0].length;
    }

    function exportWAV(type) {
      var bufferL = mergeBuffers(recBuffersL, recLength);
      var bufferR = mergeBuffers(recBuffersR, recLength);
      var interleaved = interleave(bufferL, bufferR);
      var dataview = encodeWAV(interleaved);
      var audioBlob = new Blob([dataview], {type: type});

      me.postMessage(audioBlob);
    }

    function exportMonoWAV(type) {
      var bufferL = mergeBuffers(recBuffersL, recLength);
      var dataview = encodeWAV(bufferL, true);
      var audioBlob = new Blob([dataview], {type: type});

      me.postMessage(audioBlob);
    }

    function getBuffers() {
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

    function interleave(inputL, inputR) {
      var length = inputL.length + inputR.length;
      var result = new Float32Array(length);

      var index = 0,
        inputIndex = 0;

      while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
      }
      return result;
    }

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

    function encodeWAV(samples, mono) {
      var buffer = new ArrayBuffer(44 + samples.length * 2);
      var view = new DataView(buffer);
      var channels = mono ? 1 : 2;

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
      view.setUint16(22, channels, true);
      /* sample rate */
      view.setUint32(24, sampleRate, true);
      /* byte rate (sample rate * block align) */
      view.setUint32(28, sampleRate * 2 * channels, true);
      /* block align (channel count * bytes per sample) */
      view.setUint16(32, 2 * channels, true);
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
    if (!this.context.createScriptProcessor) {
      this.node = this.context.createJavaScriptNode(bufferLen, 2, 2);
    } else {
      this.node = this.context.createScriptProcessor(bufferLen, 2, 2);
    }

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
          e.inputBuffer.getChannelData(1)
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

    this.getBuffers = function (cb) {
      currCallback = cb || config.callback;
      worker.postMessage({command: 'getBuffers'})
    };

    this.exportWAV = function (cb, type) {
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/mp3';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    };

    this.exportMonoWAV = function (cb, type) {
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/mp3';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportMonoWAV',
        type: type
      });
    };

    worker.onmessage = function (e) {
      var blob = e.data;
      currCallback(blob);
    };

    source.connect(this.node);
    this.node.connect(this.context.destination);   // if the script node is not connected to an output the "onaudioprocess" event is not triggered in chrome.
  };

  var MP3ConversionWorker = function (me, params) {
    //should not reference any variable in parent scope as it will executed in its
    //on isolated scope
    if (typeof Lame === 'undefined') {
      importScripts(params.libmp3Path);
    }

    var mp3codec;
    me.onmessage = function (e) {
      switch (e.data.cmd) {
        case 'init':
          if (!e.data.config) {
            e.data.config = {};
          }
          mp3codec = Lame.init();

          Lame.set_mode(mp3codec, e.data.config.mode || Lame.JOINT_STEREO);
          Lame.set_num_channels(mp3codec, e.data.config.channels || 2);
          Lame.set_num_samples(mp3codec, e.data.config.samples || -1);
          Lame.set_in_samplerate(mp3codec, e.data.config.samplerate || 44100);
          Lame.set_out_samplerate(mp3codec, e.data.config.samplerate || 44100);
          Lame.set_bitrate(mp3codec, e.data.config.bitrate || 128);

          Lame.init_params(mp3codec);
          console.log('Version :', Lame.get_version() + ' / ',
            'Mode: ' + Lame.get_mode(mp3codec) + ' / ',
            'Samples: ' + Lame.get_num_samples(mp3codec) + ' / ',
            'Channels: ' + Lame.get_num_channels(mp3codec) + ' / ',
            'Input Samplate: ' + Lame.get_in_samplerate(mp3codec) + ' / ',
            'Output Samplate: ' + Lame.get_in_samplerate(mp3codec) + ' / ',
            'Bitlate :' + Lame.get_bitrate(mp3codec) + ' / ',
            'VBR :' + Lame.get_VBR(mp3codec));
          break;
        case 'encode':
          var mp3data = Lame.encode_buffer_ieee_float(mp3codec, e.data.buf, e.data.buf);
          me.postMessage({cmd: 'data', buf: mp3data.data});
          break;
        case 'finish':
          var mp3data = Lame.encode_flush(mp3codec);
          me.postMessage({cmd: 'end', buf: mp3data.data});
          Lame.close(mp3codec);
          mp3codec = null;
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
    config.libmp3Path = config.libmp3Path || (SCRIPT_BASE + '/libmp3lame.min.js');
    var inProgress = false;
    var mp3Worker = MP3ConversionWorker.toWorker(config);

    var conversionId = 'conversion_' + Date.now(),
      arrayBuffer,
      tag = conversionId + ":"
      ;

    console.log(tag, 'Starting conversion');

    function parseWav(wav) {
      function readInt(i, bytes) {
        var ret = 0,
          shft = 0;

        while (bytes) {
          ret += wav[i] << shft;
          shft += 8;
          i++;
          bytes--;
        }
        return ret;
      }

      if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
      if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
      return {
        sampleRate: readInt(24, 4),
        bitsPerSample: readInt(34, 2),
        samples: wav.subarray(44)
      };
    }

    function Uint8ArrayToFloat32Array(u8a) {
      var f32Buffer = new Float32Array(u8a.length);
      for (var i = 0; i < u8a.length; i++) {
        var value = u8a[i << 1] + (u8a[(i << 1) + 1] << 8);
        if (value >= 0x8000) value |= ~0x7FFF;
        f32Buffer[i] = value / 0x8000;
      }
      return f32Buffer;
    }


    return {
      isBusy: function () {
        return inProgress;
      },
      convert: function (blob, onSuccess, onError) {
        if (inProgress) {
          throw ("Another conversion is in progress");
        }
        var initialSize = blob.size, fileReader = new FileReader(), startTime = Date.now();
        fileReader.onload = function () {
          arrayBuffer = this.result;
          try {
            var buffer = new Uint8Array(arrayBuffer),
              data = parseWav(buffer);
          } catch (e) {
            inProgress = false;
            if (typeof onError === 'function') {
              onError(e);
            }
            return;
          }

          console.log(tag, "Passed to BG process");
          mp3Worker.postMessage({
            cmd: 'init', config: {
              mode: 3,
              channels: 1,
              samplerate: data.sampleRate,
              bitrate: data.bitsPerSample
            }
          });

          mp3Worker.postMessage({cmd: 'encode', buf: Uint8ArrayToFloat32Array(data.samples)});
          mp3Worker.postMessage({cmd: 'finish'});
          mp3Worker.onmessage = function (e) {
            if (e.data.cmd == 'data') {
              console.log(tag, "Done converting to Mp3");
              var mp3Blob = new Blob([new Uint8Array(e.data.buf)], {type: 'audio/mp3'});
              console.log(tag, "Conversion completed in: " + ((Date.now() - startTime) / 1000) + 's');
              var finalSize = mp3Blob.size;
              console.log(tag +
                "Initial size: = " + initialSize + ", " +
                "Final size = " + finalSize
                + ", Reduction: " + (100 * (initialSize - finalSize) / initialSize) + "%");

              inProgress = false;
              if (onSuccess && typeof onSuccess === 'function') {
                onSuccess(mp3Blob);
              }
            }
          };
        };
        inProgress = true;
        fileReader.readAsArrayBuffer(blob);
      }
    }
  };

  window.Recorder = Recorder;
  window.MP3Converter = MP3Converter;

})(window);
