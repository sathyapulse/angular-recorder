//swfobject.js for flash file inclusion
/*  SWFObject v2.2 <http://code.google.com/p/swfobject/>
 is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
 */
var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();


(function(global) {
  var Recorder;

  var RECORDED_AUDIO_TYPE = "audio/mp3";

  Recorder = {
    recorder: null,
    recorderOriginalWidth: 0,
    recorderOriginalHeight: 0,
    uploadFormId: null,
    uploadFieldName: null,
    isReady: false,

    connect: function(name, attempts) {
      if(navigator.appName.indexOf("Microsoft") != -1) {
        Recorder.recorder = window[name];
      } else {
        Recorder.recorder = document[name];
      }

      if(attempts >= 40) {
        return;
      }

      // flash app needs time to load and initialize
      if(Recorder.recorder && Recorder.recorder.init) {
        Recorder.recorderOriginalWidth = Recorder.recorder.width;
        Recorder.recorderOriginalHeight = Recorder.recorder.height;
        if(Recorder.uploadFormId && $) {
          var frm = $(Recorder.uploadFormId);
          Recorder.recorder.init(frm.attr('action').toString(), Recorder.uploadFieldName, frm.serializeArray());
        }
        return;
      }

      setTimeout(function() {Recorder.connect(name, attempts+1);}, 100);
    },

    playBack: function(name) {
      // TODO: Rename to `playback`
      Recorder.recorder.playBack(name);
    },

    pausePlayBack: function(name) {
      // TODO: Rename to `pausePlayback`
      Recorder.recorder.pausePlayBack(name);
    },

    playBackFrom: function(name, time) {
      // TODO: Rename to `playbackFrom`
      Recorder.recorder.playBackFrom(name, time);
    },

    record: function(name, filename) {
      Recorder.recorder.record(name, filename);
    },

    stopRecording: function() {
      Recorder.recorder.stopRecording();
    },

    stopPlayBack: function() {
      // TODO: Rename to `stopPlayback`
      Recorder.recorder.stopPlayBack();
    },

    observeLevel: function() {
      Recorder.recorder.observeLevel();
    },

    stopObservingLevel: function() {
      Recorder.recorder.stopObservingLevel();
    },

    observeSamples: function() {
      Recorder.recorder.observeSamples();
    },

    stopObservingSamples: function() {
      Recorder.recorder.stopObservingSamples();
    },

    resize: function(width, height) {
      Recorder.recorder.width = width + "px";
      Recorder.recorder.height = height + "px";
    },

    defaultSize: function() {
      Recorder.resize(Recorder.recorderOriginalWidth, Recorder.recorderOriginalHeight);
    },

    show: function() {
      Recorder.recorder.show();
    },

    hide: function() {
      Recorder.recorder.hide();
    },

    duration: function(name) {
      // TODO: rename to `getDuration`
      return Recorder.recorder.duration(name || Recorder.uploadFieldName);
    },

    getBase64: function(name) {
      var data = Recorder.recorder.getBase64(name);
      return 'data:' + RECORDED_AUDIO_TYPE + ';base64,' + data;
    },

    getBlob: function(name) {
      var base64Data = Recorder.getBase64(name).split(',')[1];
      return base64toBlob(base64Data, RECORDED_AUDIO_TYPE);
    },

    getCurrentTime: function(name) {
    	return Recorder.recorder.getCurrentTime(name);
    },

    isMicrophoneAccessible: function() {
      return Recorder.recorder.isMicrophoneAccessible();
    },

    updateForm: function() {
      var frm = $(Recorder.uploadFormId);
      Recorder.recorder.update(frm.serializeArray());
    },

    showPermissionWindow: function(options) {
      Recorder.resize(240, 160);
      // need to wait until app is resized before displaying permissions screen
      var permissionCommand = function() {
        if (options && options.permanent) {
          Recorder.recorder.permitPermanently();
        } else {
          Recorder.recorder.permit();
        }
      };
      setTimeout(permissionCommand, 1);
    },

    configure: function(rate, gain, silenceLevel, silenceTimeout) {
      rate = parseInt(rate || 22);
      gain = parseInt(gain || 100);
      silenceLevel = parseInt(silenceLevel || 0);
      silenceTimeout = parseInt(silenceTimeout || 4000);
      switch(rate) {
      case 44:
      case 22:
      case 11:
      case 8:
      case 5:
        break;
      default:
        throw("invalid rate " + rate);
      }

      if(gain < 0 || gain > 100) {
        throw("invalid gain " + gain);
      }

      if(silenceLevel < 0 || silenceLevel > 100) {
        throw("invalid silenceLevel " + silenceLevel);
      }

      if(silenceTimeout < -1) {
        throw("invalid silenceTimeout " + silenceTimeout);
      }

      Recorder.recorder.configure(rate, gain, silenceLevel, silenceTimeout);
    },

    setUseEchoSuppression: function(val) {
      if(typeof(val) != 'boolean') {
        throw("invalid value for setting echo suppression, val: " + val);
      }

      Recorder.recorder.setUseEchoSuppression(val);
    },

    setLoopBack: function(val) {
      if(typeof(val) != 'boolean') {
        throw("invalid value for setting loop back, val: " + val);
      }

      Recorder.recorder.setLoopBack(val);
    },
    getRecorderDataUrl: function(){
      return recorderAsDataUrl();
    }

  };

  function base64toBlob(b64Data, contentType, sliceSize) {
    contentType = contentType || '';
    sliceSize = sliceSize || 512;

    var byteCharacters = atob(b64Data);
    var byteArrays = [];

    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);

      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, {type: contentType});
  }


  global.FWRecorder = Recorder;

  //recorder encoded as a string.
  var recorderAsDataUrl = function(){
    return "data:application/x-shockwave-flash;base64,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";
  };

})(this);