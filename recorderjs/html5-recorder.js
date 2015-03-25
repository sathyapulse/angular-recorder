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

(function(window){

  var Recorder = function(source, cfg){
    var config = cfg || {};
    var bufferLen = config.bufferLen || 4096;
    this.context = source.context;
    if(!this.context.createScriptProcessor){
       this.node = this.context.createJavaScriptNode(bufferLen, 2, 2);
    } else {
       this.node = this.context.createScriptProcessor(bufferLen, 2, 2);
    }

      var workerBlob = new Blob(['function init(e){sampleRate=e.sampleRate}function record(e){recBuffersL.push(e[0]),recBuffersR.push(e[1]),recLength+=e[0].length}function exportWAV(e){var t=mergeBuffers(recBuffersL,recLength),r=mergeBuffers(recBuffersR,recLength),n=interleave(t,r),a=encodeWAV(n),f=new Blob([a],{type:e});this.postMessage(f)}function exportMonoWAV(e){var t=mergeBuffers(recBuffersL,recLength),r=encodeWAV(t,!0),n=new Blob([r],{type:e});this.postMessage(n)}function getBuffers(){var e=[];e.push(mergeBuffers(recBuffersL,recLength)),e.push(mergeBuffers(recBuffersR,recLength)),this.postMessage(e)}function clear(){recLength=0,recBuffersL=[],recBuffersR=[]}function mergeBuffers(e,t){for(var r=new Float32Array(t),n=0,a=0;a<e.length;a++)r.set(e[a],n),n+=e[a].length;return r}function interleave(e,t){for(var r=e.length+t.length,n=new Float32Array(r),a=0,f=0;r>a;)n[a++]=e[f],n[a++]=t[f],f++;return n}function floatTo16BitPCM(e,t,r){for(var n=0;n<r.length;n++,t+=2){var a=Math.max(-1,Math.min(1,r[n]));e.setInt16(t,0>a?32768*a:32767*a,!0)}}function writeString(e,t,r){for(var n=0;n<r.length;n++)e.setUint8(t+n,r.charCodeAt(n))}function encodeWAV(e,t){var r=new ArrayBuffer(44+2*e.length),n=new DataView(r);return writeString(n,0,"RIFF"),n.setUint32(4,32+2*e.length,!0),writeString(n,8,"WAVE"),writeString(n,12,"fmt "),n.setUint32(16,16,!0),n.setUint16(20,1,!0),n.setUint16(22,t?1:2,!0),n.setUint32(24,sampleRate,!0),n.setUint32(28,4*sampleRate,!0),n.setUint16(32,4,!0),n.setUint16(34,16,!0),writeString(n,36,"data"),n.setUint32(40,2*e.length,!0),floatTo16BitPCM(n,44,e),n}var recLength=0,recBuffersL=[],recBuffersR=[],sampleRate;this.onmessage=function(e){switch(e.data.command){case"init":init(e.data.config);break;case"record":record(e.data.buffer);break;case"exportWAV":exportWAV(e.data.type);break;case"exportMonoWAV":exportMonoWAV(e.data.type);break;case"getBuffers":getBuffers();break;case"clear":clear()}};']);

      // Obtain a blob URL reference to our worker 'file'.
      var workerBlobUrl = window.URL.createObjectURL(workerBlob);

    var worker = new Worker(config.workerPath || workerBlobUrl);

    worker.postMessage({
      command: 'init',
      config: {
        sampleRate: this.context.sampleRate
      }
    });
    var recording = false,
      currCallback;

    this.node.onaudioprocess = function(e){
      if (!recording) return;
      worker.postMessage({
        command: 'record',
        buffer: [
          e.inputBuffer.getChannelData(0),
          e.inputBuffer.getChannelData(1)
        ]
      });
    }

    this.configure = function(cfg){
      for (var prop in cfg){
        if (cfg.hasOwnProperty(prop)){
          config[prop] = cfg[prop];
        }
      }
    }

    this.record = function(){
      recording = true;
    }

    this.stop = function(){
      recording = false;
    }

    this.clear = function(){
      worker.postMessage({ command: 'clear' });
    }

    this.getBuffers = function(cb) {
      currCallback = cb || config.callback;
      worker.postMessage({ command: 'getBuffers' })
    }

    this.exportWAV = function(cb, type){
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/mp3';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportWAV',
        type: type
      });
    }

    this.exportMonoWAV = function(cb, type){
      currCallback = cb || config.callback;
      type = type || config.type || 'audio/mp3';
      if (!currCallback) throw new Error('Callback not set');
      worker.postMessage({
        command: 'exportMonoWAV',
        type: type
      });
    }

    worker.onmessage = function(e){
      var blob = e.data;
      currCallback(blob);
    }

    source.connect(this.node);
    this.node.connect(this.context.destination);   // if the script node is not connected to an output the "onaudioprocess" event is not triggered in chrome.
  };

  window.Recorder = Recorder;

})(window);
