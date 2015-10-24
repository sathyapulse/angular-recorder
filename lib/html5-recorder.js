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

  var workerToBlobUrl = function (fn) {
    if (typeof fn !== 'function') {
      throw("The specified parameter must be a valid function");
    }
    var fnString = fn.toString();
    if (fnString.match(/\[native\s*code\]/i)) {
      throw("You cannot bind a native function to a worker");
    }
    var blobURL = URL.createObjectURL(new Blob(['(', fnString, ')(this)'], {type: 'application/javascript'}));

    return blobURL;
  };

  Function.prototype.toWorker = function () {
    var url = workerToBlobUrl(this);
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
      view.setUint16(32, 2*channels, true);
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

  window.Recorder = Recorder;

})(window);
