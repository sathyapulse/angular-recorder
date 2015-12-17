//swfobject.js for flash file inclusion

/*  SWFObject v2.2 <http://code.google.com/p/swfobject/> 
  is released under the MIT License <http://www.opensource.org/licenses/mit-license.php> 
*/

/*Orginal code*/
//var swfobject=function(){var D="undefined",r="object",S="Shockwave Flash",W="ShockwaveFlash.ShockwaveFlash",q="application/x-shockwave-flash",R="SWFObjectExprInst",x="onreadystatechange",O=window,j=document,t=navigator,T=false,U=[h],o=[],N=[],I=[],l,Q,E,B,J=false,a=false,n,G,m=true,M=function(){var aa=typeof j.getElementById!=D&&typeof j.getElementsByTagName!=D&&typeof j.createElement!=D,ah=t.userAgent.toLowerCase(),Y=t.platform.toLowerCase(),ae=Y?/win/.test(Y):/win/.test(ah),ac=Y?/mac/.test(Y):/mac/.test(ah),af=/webkit/.test(ah)?parseFloat(ah.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,X=!+"\v1",ag=[0,0,0],ab=null;if(typeof t.plugins!=D&&typeof t.plugins[S]==r){ab=t.plugins[S].description;if(ab&&!(typeof t.mimeTypes!=D&&t.mimeTypes[q]&&!t.mimeTypes[q].enabledPlugin)){T=true;X=false;ab=ab.replace(/^.*\s+(\S+\s+\S+$)/,"$1");ag[0]=parseInt(ab.replace(/^(.*)\..*$/,"$1"),10);ag[1]=parseInt(ab.replace(/^.*\.(.*)\s.*$/,"$1"),10);ag[2]=/[a-zA-Z]/.test(ab)?parseInt(ab.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0}}else{if(typeof O.ActiveXObject!=D){try{var ad=new ActiveXObject(W);if(ad){ab=ad.GetVariable("$version");if(ab){X=true;ab=ab.split(" ")[1].split(",");ag=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}}catch(Z){}}}return{w3:aa,pv:ag,wk:af,ie:X,win:ae,mac:ac}}(),k=function(){if(!M.w3){return}if((typeof j.readyState!=D&&j.readyState=="complete")||(typeof j.readyState==D&&(j.getElementsByTagName("body")[0]||j.body))){f()}if(!J){if(typeof j.addEventListener!=D){j.addEventListener("DOMContentLoaded",f,false)}if(M.ie&&M.win){j.attachEvent(x,function(){if(j.readyState=="complete"){j.detachEvent(x,arguments.callee);f()}});if(O==top){(function(){if(J){return}try{j.documentElement.doScroll("left")}catch(X){setTimeout(arguments.callee,0);return}f()})()}}if(M.wk){(function(){if(J){return}if(!/loaded|complete/.test(j.readyState)){setTimeout(arguments.callee,0);return}f()})()}s(f)}}();function f(){if(J){return}try{var Z=j.getElementsByTagName("body")[0].appendChild(C("span"));Z.parentNode.removeChild(Z)}catch(aa){return}J=true;var X=U.length;for(var Y=0;Y<X;Y++){U[Y]()}}function K(X){if(J){X()}else{U[U.length]=X}}function s(Y){if(typeof O.addEventListener!=D){O.addEventListener("load",Y,false)}else{if(typeof j.addEventListener!=D){j.addEventListener("load",Y,false)}else{if(typeof O.attachEvent!=D){i(O,"onload",Y)}else{if(typeof O.onload=="function"){var X=O.onload;O.onload=function(){X();Y()}}else{O.onload=Y}}}}}function h(){if(T){V()}else{H()}}function V(){var X=j.getElementsByTagName("body")[0];var aa=C(r);aa.setAttribute("type",q);var Z=X.appendChild(aa);if(Z){var Y=0;(function(){if(typeof Z.GetVariable!=D){var ab=Z.GetVariable("$version");if(ab){ab=ab.split(" ")[1].split(",");M.pv=[parseInt(ab[0],10),parseInt(ab[1],10),parseInt(ab[2],10)]}}else{if(Y<10){Y++;setTimeout(arguments.callee,10);return}}X.removeChild(aa);Z=null;H()})()}else{H()}}function H(){var ag=o.length;if(ag>0){for(var af=0;af<ag;af++){var Y=o[af].id;var ab=o[af].callbackFn;var aa={success:false,id:Y};if(M.pv[0]>0){var ae=c(Y);if(ae){if(F(o[af].swfVersion)&&!(M.wk&&M.wk<312)){w(Y,true);if(ab){aa.success=true;aa.ref=z(Y);ab(aa)}}else{if(o[af].expressInstall&&A()){var ai={};ai.data=o[af].expressInstall;ai.width=ae.getAttribute("width")||"0";ai.height=ae.getAttribute("height")||"0";if(ae.getAttribute("class")){ai.styleclass=ae.getAttribute("class")}if(ae.getAttribute("align")){ai.align=ae.getAttribute("align")}var ah={};var X=ae.getElementsByTagName("param");var ac=X.length;for(var ad=0;ad<ac;ad++){if(X[ad].getAttribute("name").toLowerCase()!="movie"){ah[X[ad].getAttribute("name")]=X[ad].getAttribute("value")}}P(ai,ah,Y,ab)}else{p(ae);if(ab){ab(aa)}}}}}else{w(Y,true);if(ab){var Z=z(Y);if(Z&&typeof Z.SetVariable!=D){aa.success=true;aa.ref=Z}ab(aa)}}}}}function z(aa){var X=null;var Y=c(aa);if(Y&&Y.nodeName=="OBJECT"){if(typeof Y.SetVariable!=D){X=Y}else{var Z=Y.getElementsByTagName(r)[0];if(Z){X=Z}}}return X}function A(){return !a&&F("6.0.65")&&(M.win||M.mac)&&!(M.wk&&M.wk<312)}function P(aa,ab,X,Z){a=true;E=Z||null;B={success:false,id:X};var ae=c(X);if(ae){if(ae.nodeName=="OBJECT"){l=g(ae);Q=null}else{l=ae;Q=X}aa.id=R;if(typeof aa.width==D||(!/%$/.test(aa.width)&&parseInt(aa.width,10)<310)){aa.width="310"}if(typeof aa.height==D||(!/%$/.test(aa.height)&&parseInt(aa.height,10)<137)){aa.height="137"}j.title=j.title.slice(0,47)+" - Flash Player Installation";var ad=M.ie&&M.win?"ActiveX":"PlugIn",ac="MMredirectURL="+O.location.toString().replace(/&/g,"%26")+"&MMplayerType="+ad+"&MMdoctitle="+j.title;if(typeof ab.flashvars!=D){ab.flashvars+="&"+ac}else{ab.flashvars=ac}if(M.ie&&M.win&&ae.readyState!=4){var Y=C("div");X+="SWFObjectNew";Y.setAttribute("id",X);ae.parentNode.insertBefore(Y,ae);ae.style.display="none";(function(){if(ae.readyState==4){ae.parentNode.removeChild(ae)}else{setTimeout(arguments.callee,10)}})()}u(aa,ab,X)}}function p(Y){if(M.ie&&M.win&&Y.readyState!=4){var X=C("div");Y.parentNode.insertBefore(X,Y);X.parentNode.replaceChild(g(Y),X);Y.style.display="none";(function(){if(Y.readyState==4){Y.parentNode.removeChild(Y)}else{setTimeout(arguments.callee,10)}})()}else{Y.parentNode.replaceChild(g(Y),Y)}}function g(ab){var aa=C("div");if(M.win&&M.ie){aa.innerHTML=ab.innerHTML}else{var Y=ab.getElementsByTagName(r)[0];if(Y){var ad=Y.childNodes;if(ad){var X=ad.length;for(var Z=0;Z<X;Z++){if(!(ad[Z].nodeType==1&&ad[Z].nodeName=="PARAM")&&!(ad[Z].nodeType==8)){aa.appendChild(ad[Z].cloneNode(true))}}}}}return aa}function u(ai,ag,Y){var X,aa=c(Y);if(M.wk&&M.wk<312){return X}if(aa){if(typeof ai.id==D){ai.id=Y}if(M.ie&&M.win){var ah="";for(var ae in ai){if(ai[ae]!=Object.prototype[ae]){if(ae.toLowerCase()=="data"){ag.movie=ai[ae]}else{if(ae.toLowerCase()=="styleclass"){ah+=' class="'+ai[ae]+'"'}else{if(ae.toLowerCase()!="classid"){ah+=" "+ae+'="'+ai[ae]+'"'}}}}}var af="";for(var ad in ag){if(ag[ad]!=Object.prototype[ad]){af+='<param name="'+ad+'" value="'+ag[ad]+'" />'}}aa.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+ah+">"+af+"</object>";N[N.length]=ai.id;X=c(ai.id)}else{var Z=C(r);Z.setAttribute("type",q);for(var ac in ai){if(ai[ac]!=Object.prototype[ac]){if(ac.toLowerCase()=="styleclass"){Z.setAttribute("class",ai[ac])}else{if(ac.toLowerCase()!="classid"){Z.setAttribute(ac,ai[ac])}}}}for(var ab in ag){if(ag[ab]!=Object.prototype[ab]&&ab.toLowerCase()!="movie"){e(Z,ab,ag[ab])}}aa.parentNode.replaceChild(Z,aa);X=Z}}return X}function e(Z,X,Y){var aa=C("param");aa.setAttribute("name",X);aa.setAttribute("value",Y);Z.appendChild(aa)}function y(Y){var X=c(Y);if(X&&X.nodeName=="OBJECT"){if(M.ie&&M.win){X.style.display="none";(function(){if(X.readyState==4){b(Y)}else{setTimeout(arguments.callee,10)}})()}else{X.parentNode.removeChild(X)}}}function b(Z){var Y=c(Z);if(Y){for(var X in Y){if(typeof Y[X]=="function"){Y[X]=null}}Y.parentNode.removeChild(Y)}}function c(Z){var X=null;try{X=j.getElementById(Z)}catch(Y){}return X}function C(X){return j.createElement(X)}function i(Z,X,Y){Z.attachEvent(X,Y);I[I.length]=[Z,X,Y]}function F(Z){var Y=M.pv,X=Z.split(".");X[0]=parseInt(X[0],10);X[1]=parseInt(X[1],10)||0;X[2]=parseInt(X[2],10)||0;return(Y[0]>X[0]||(Y[0]==X[0]&&Y[1]>X[1])||(Y[0]==X[0]&&Y[1]==X[1]&&Y[2]>=X[2]))?true:false}function v(ac,Y,ad,ab){if(M.ie&&M.mac){return}var aa=j.getElementsByTagName("head")[0];if(!aa){return}var X=(ad&&typeof ad=="string")?ad:"screen";if(ab){n=null;G=null}if(!n||G!=X){var Z=C("style");Z.setAttribute("type","text/css");Z.setAttribute("media",X);n=aa.appendChild(Z);if(M.ie&&M.win&&typeof j.styleSheets!=D&&j.styleSheets.length>0){n=j.styleSheets[j.styleSheets.length-1]}G=X}if(M.ie&&M.win){if(n&&typeof n.addRule==r){n.addRule(ac,Y)}}else{if(n&&typeof j.createTextNode!=D){n.appendChild(j.createTextNode(ac+" {"+Y+"}"))}}}function w(Z,X){if(!m){return}var Y=X?"visible":"hidden";if(J&&c(Z)){c(Z).style.visibility=Y}else{v("#"+Z,"visibility:"+Y)}}function L(Y){var Z=/[\\\"<>\.;]/;var X=Z.exec(Y)!=null;return X&&typeof encodeURIComponent!=D?encodeURIComponent(Y):Y}var d=function(){if(M.ie&&M.win){window.attachEvent("onunload",function(){var ac=I.length;for(var ab=0;ab<ac;ab++){I[ab][0].detachEvent(I[ab][1],I[ab][2])}var Z=N.length;for(var aa=0;aa<Z;aa++){y(N[aa])}for(var Y in M){M[Y]=null}M=null;for(var X in swfobject){swfobject[X]=null}swfobject=null})}}();return{registerObject:function(ab,X,aa,Z){if(M.w3&&ab&&X){var Y={};Y.id=ab;Y.swfVersion=X;Y.expressInstall=aa;Y.callbackFn=Z;o[o.length]=Y;w(ab,false)}else{if(Z){Z({success:false,id:ab})}}},getObjectById:function(X){if(M.w3){return z(X)}},embedSWF:function(ab,ah,ae,ag,Y,aa,Z,ad,af,ac){var X={success:false,id:ah};if(M.w3&&!(M.wk&&M.wk<312)&&ab&&ah&&ae&&ag&&Y){w(ah,false);K(function(){ae+="";ag+="";var aj={};if(af&&typeof af===r){for(var al in af){aj[al]=af[al]}}aj.data=ab;aj.width=ae;aj.height=ag;var am={};if(ad&&typeof ad===r){for(var ak in ad){am[ak]=ad[ak]}}if(Z&&typeof Z===r){for(var ai in Z){if(typeof am.flashvars!=D){am.flashvars+="&"+ai+"="+Z[ai]}else{am.flashvars=ai+"="+Z[ai]}}}if(F(Y)){var an=u(aj,am,ah);if(aj.id==ah){w(ah,true)}X.success=true;X.ref=an}else{if(aa&&A()){aj.data=aa;P(aj,am,ah,ac);return}else{w(ah,true)}}if(ac){ac(X)}})}else{if(ac){ac(X)}}},switchOffAutoHideShow:function(){m=false},ua:M,getFlashPlayerVersion:function(){return{major:M.pv[0],minor:M.pv[1],release:M.pv[2]}},hasFlashPlayerVersion:F,createSWF:function(Z,Y,X){if(M.w3){return u(Z,Y,X)}else{return undefined}},showExpressInstall:function(Z,aa,X,Y){if(M.w3&&A()){P(Z,aa,X,Y)}},removeSWF:function(X){if(M.w3){y(X)}},createCSS:function(aa,Z,Y,X){if(M.w3){v(aa,Z,Y,X)}},addDomLoadEvent:K,addLoadEvent:s,getQueryParamValue:function(aa){var Z=j.location.search||j.location.hash;if(Z){if(/\?/.test(Z)){Z=Z.split("?")[1]}if(aa==null){return L(Z)}var Y=Z.split("&");for(var X=0;X<Y.length;X++){if(Y[X].substring(0,Y[X].indexOf("="))==aa){return L(Y[X].substring((Y[X].indexOf("=")+1)))}}}return""},expressInstallCallback:function(){if(a){var X=c(R);if(X&&l){X.parentNode.replaceChild(l,X);if(Q){w(Q,true);if(M.ie&&M.win){l.style.display="block"}}if(E){E(B)}}a=false}}}}();

/*Fixed code*/
var swfobject=function(){function e(){if(!G){try{var e=M.getElementsByTagName("body")[0].appendChild(h("span"));e.parentNode.removeChild(e)}catch(t){return}G=!0;for(var n=R.length,a=0;n>a;a++)R[a]()}}function t(e){G?e():R[R.length]=e}function n(e){if(typeof x.addEventListener!=L)x.addEventListener("load",e,!1);else if(typeof M.addEventListener!=L)M.addEventListener("load",e,!1);else if(typeof x.attachEvent!=L)m(x,"onload",e);else if("function"==typeof x.onload){var t=x.onload;x.onload=function(){t(),e()}}else x.onload=e}function a(){P?i():r()}function i(){var e=M.getElementsByTagName("body")[0],t=h(k);t.setAttribute("type",O);var n=e.appendChild(t);if(n){var a=0;!function(){if(typeof n.GetVariable!=L){var i=n.GetVariable("$version");i&&(i=i.split(" ")[1].split(","),X.pv=[parseInt(i[0],10),parseInt(i[1],10),parseInt(i[2],10)])}else if(10>a)return a++,void setTimeout(arguments.callee,10);e.removeChild(t),n=null,r()}()}else r()}function r(){var e=D.length;if(e>0)for(var t=0;e>t;t++){var n=D[t].id,a=D[t].callbackFn,i={success:!1,id:n};if(X.pv[0]>0){var r=y(n);if(r)if(!g(D[t].swfVersion)||X.wk&&X.wk<312)if(D[t].expressInstall&&s()){var f={};f.data=D[t].expressInstall,f.width=r.getAttribute("width")||"0",f.height=r.getAttribute("height")||"0",r.getAttribute("class")&&(f.styleclass=r.getAttribute("class")),r.getAttribute("align")&&(f.align=r.getAttribute("align"));for(var d={},u=r.getElementsByTagName("param"),p=u.length,v=0;p>v;v++)"movie"!=u[v].getAttribute("name").toLowerCase()&&(d[u[v].getAttribute("name")]=u[v].getAttribute("value"));l(f,d,n,a)}else c(r),a&&a(i);else b(n,!0),a&&(i.success=!0,i.ref=o(n),a(i))}else if(b(n,!0),a){var h=o(n);h&&typeof h.SetVariable!=L&&(i.success=!0,i.ref=h),a(i)}}}function o(e){var t=null,n=y(e);if(n&&"OBJECT"==n.nodeName)if(typeof n.SetVariable!=L)t=n;else{var a=n.getElementsByTagName(k)[0];a&&(t=a)}return t}function s(){return!J&&g("6.0.65")&&(X.win||X.mac)&&!(X.wk&&X.wk<312)}function l(e,t,n,a){J=!0,A=a||null,N={success:!1,id:n};var i=y(n);if(i){if("OBJECT"==i.nodeName?(E=f(i),S=null):(E=i,S=n),e.id=F,(typeof e.width==L||!/%$/.test(e.width)&&parseInt(e.width,10)<310)&&(e.width="310"),(typeof e.height==L||!/%$/.test(e.height)&&parseInt(e.height,10)<137)&&(e.height="137"),M.title=M.title.slice(0,47)+" - Flash Player Installation","undefined"!=typeof D.location)var r=X.ie&&X.win?"ActiveX":"PlugIn",o="MMredirectURL="+x.location.toString().replace(/&/g,"%26")+"&MMplayerType="+r+"&MMdoctitle="+M.title;if(typeof t.flashvars!=L?t.flashvars+="&"+o:t.flashvars=o,X.ie&&X.win&&4!=i.readyState){var s=h("div");n+="SWFObjectNew",s.setAttribute("id",n),i.parentNode.insertBefore(s,i),i.style.display="none",function(){4==i.readyState?i.parentNode.removeChild(i):setTimeout(arguments.callee,10)}()}d(e,t,n)}}function c(e){if(X.ie&&X.win&&4!=e.readyState){var t=h("div");e.parentNode.insertBefore(t,e),t.parentNode.replaceChild(f(e),t),e.style.display="none",function(){4==e.readyState?e.parentNode.removeChild(e):setTimeout(arguments.callee,10)}()}else e.parentNode.replaceChild(f(e),e)}function f(e){var t=h("div");if(X.win&&X.ie)t.innerHTML=e.innerHTML;else{var n=e.getElementsByTagName(k)[0];if(n){var a=n.childNodes;if(a)for(var i=a.length,r=0;i>r;r++)1==a[r].nodeType&&"PARAM"==a[r].nodeName||8==a[r].nodeType||t.appendChild(a[r].cloneNode(!0))}}return t}function d(e,t,n){var a,i=y(n);if(X.wk&&X.wk<312)return a;if(i)if(typeof e.id==L&&(e.id=n),X.ie&&X.win){var r="";for(var o in e)e[o]!=Object.prototype[o]&&("data"==o.toLowerCase()?t.movie=e[o]:"styleclass"==o.toLowerCase()?r+=' class="'+e[o]+'"':"classid"!=o.toLowerCase()&&(r+=" "+o+'="'+e[o]+'"'));var s="";for(var l in t)t[l]!=Object.prototype[l]&&(s+='<param name="'+l+'" value="'+t[l]+'" />');i.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+r+">"+s+"</object>",W[W.length]=e.id,a=y(e.id)}else{var c=h(k);c.setAttribute("type",O);for(var f in e)e[f]!=Object.prototype[f]&&("styleclass"==f.toLowerCase()?c.setAttribute("class",e[f]):"classid"!=f.toLowerCase()&&c.setAttribute(f,e[f]));for(var d in t)t[d]!=Object.prototype[d]&&"movie"!=d.toLowerCase()&&u(c,d,t[d]);i.parentNode.replaceChild(c,i),a=c}return a}function u(e,t,n){var a=h("param");a.setAttribute("name",t),a.setAttribute("value",n),e.appendChild(a)}function p(e){var t=y(e);t&&"OBJECT"==t.nodeName&&(X.ie&&X.win?(t.style.display="none",function(){4==t.readyState?v(e):setTimeout(arguments.callee,10)}()):t.parentNode.removeChild(t))}function v(e){var t=y(e);if(t){for(var n in t)"function"==typeof t[n]&&(t[n]=null);t.parentNode.removeChild(t)}}function y(e){var t=null;try{t=M.getElementById(e)}catch(n){}return t}function h(e){return M.createElement(e)}function m(e,t,n){e.attachEvent(t,n),H[H.length]=[e,t,n]}function g(e){var t=X.pv,n=e.split(".");return n[0]=parseInt(n[0],10),n[1]=parseInt(n[1],10)||0,n[2]=parseInt(n[2],10)||0,t[0]>n[0]||t[0]==n[0]&&t[1]>n[1]||t[0]==n[0]&&t[1]==n[1]&&t[2]>=n[2]?!0:!1}function w(e,t,n,a){if(!X.ie||!X.mac){var i=M.getElementsByTagName("head")[0];if(i){var r=n&&"string"==typeof n?n:"screen";if(a&&(T=null,I=null),!T||I!=r){var o=h("style");o.setAttribute("type","text/css"),o.setAttribute("media",r),T=i.appendChild(o),X.ie&&X.win&&typeof M.styleSheets!=L&&M.styleSheets.length>0&&(T=M.styleSheets[M.styleSheets.length-1]),I=r}X.ie&&X.win?T&&typeof T.addRule==k&&T.addRule(e,t):T&&typeof M.createTextNode!=L&&T.appendChild(M.createTextNode(e+" {"+t+"}"))}}}function b(e,t){if(U){var n=t?"visible":"hidden";G&&y(e)?y(e).style.visibility=n:w("#"+e,"visibility:"+n)}}function C(e){var t=/[\\\"<>\.;]/,n=null!=t.exec(e);return n&&typeof encodeURIComponent!=L?encodeURIComponent(e):e}var E,S,A,N,T,I,L="undefined",k="object",j="Shockwave Flash",B="ShockwaveFlash.ShockwaveFlash",O="application/x-shockwave-flash",F="SWFObjectExprInst",$="onreadystatechange",x=window,M=document,V=navigator,P=!1,R=[a],D=[],W=[],H=[],G=!1,J=!1,U=!0,X=function(){var e=typeof M.getElementById!=L&&typeof M.getElementsByTagName!=L&&typeof M.createElement!=L,t=V.userAgent.toLowerCase(),n=V.platform.toLowerCase(),a=n?/win/.test(n):/win/.test(t),i=n?/mac/.test(n):/mac/.test(t),r=/webkit/.test(t)?parseFloat(t.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):!1,o=!1,s=[0,0,0],l=null;if(typeof V.plugins!=L&&typeof V.plugins[j]==k)l=V.plugins[j].description,!l||typeof V.mimeTypes!=L&&V.mimeTypes[O]&&!V.mimeTypes[O].enabledPlugin||(P=!0,o=!1,l=l.replace(/^.*\s+(\S+\s+\S+$)/,"$1"),s[0]=parseInt(l.replace(/^(.*)\..*$/,"$1"),10),s[1]=parseInt(l.replace(/^.*\.(.*)\s.*$/,"$1"),10),s[2]=/[a-zA-Z]/.test(l)?parseInt(l.replace(/^.*[a-zA-Z]+(.*)$/,"$1"),10):0);else if(typeof x.ActiveXObject!=L)try{var c=new ActiveXObject(B);c&&(l=c.GetVariable("$version"),l&&(o=!0,l=l.split(" ")[1].split(","),s=[parseInt(l[0],10),parseInt(l[1],10),parseInt(l[2],10)]))}catch(f){}return{w3:e,pv:s,wk:r,ie:o,win:a,mac:i}}();(function(){X.w3&&((typeof M.readyState!=L&&"complete"==M.readyState||typeof M.readyState==L&&(M.getElementsByTagName("body")[0]||M.body))&&e(),G||(typeof M.addEventListener!=L&&M.addEventListener("DOMContentLoaded",e,!1),X.ie&&X.win&&(M.attachEvent($,function(){"complete"==M.readyState&&(M.detachEvent($,arguments.callee),e())}),x==top&&!function(){if(!G){try{M.documentElement.doScroll("left")}catch(t){return void setTimeout(arguments.callee,0)}e()}}()),X.wk&&!function(){return G?void 0:/loaded|complete/.test(M.readyState)?void e():void setTimeout(arguments.callee,0)}(),n(e)))})(),function(){X.ie&&X.win&&window.attachEvent("onunload",function(){for(var e=H.length,t=0;e>t;t++)H[t][0].detachEvent(H[t][1],H[t][2]);for(var n=W.length,a=0;n>a;a++)p(W[a]);for(var i in X)X[i]=null;X=null;for(var r in swfobject)swfobject[r]=null;swfobject=null})}();return{registerObject:function(e,t,n,a){if(X.w3&&e&&t){var i={};i.id=e,i.swfVersion=t,i.expressInstall=n,i.callbackFn=a,D[D.length]=i,b(e,!1)}else a&&a({success:!1,id:e})},getObjectById:function(e){return X.w3?o(e):void 0},embedSWF:function(e,n,a,i,r,o,c,f,u,p){var v={success:!1,id:n};X.w3&&!(X.wk&&X.wk<312)&&e&&n&&a&&i&&r?(b(n,!1),t(function(){a+="",i+="";var t={};if(u&&typeof u===k)for(var y in u)t[y]=u[y];t.data=e,t.width=a,t.height=i;var h={};if(f&&typeof f===k)for(var m in f)h[m]=f[m];if(c&&typeof c===k)for(var w in c)typeof h.flashvars!=L?h.flashvars+="&"+w+"="+c[w]:h.flashvars=w+"="+c[w];if(g(r)){var C=d(t,h,n);t.id==n&&b(n,!0),v.success=!0,v.ref=C}else{if(o&&s())return t.data=o,void l(t,h,n,p);b(n,!0)}p&&p(v)})):p&&p(v)},switchOffAutoHideShow:function(){U=!1},ua:X,getFlashPlayerVersion:function(){return{major:X.pv[0],minor:X.pv[1],release:X.pv[2]}},hasFlashPlayerVersion:g,createSWF:function(e,t,n){return X.w3?d(e,t,n):void 0},showExpressInstall:function(e,t,n,a){X.w3&&s()&&l(e,t,n,a)},removeSWF:function(e){X.w3&&p(e)},createCSS:function(e,t,n,a){X.w3&&w(e,t,n,a)},addDomLoadEvent:t,addLoadEvent:n,getQueryParamValue:function(e){var t=M.location.search||M.location.hash;if(t){if(/\?/.test(t)&&(t=t.split("?")[1]),null==e)return C(t);for(var n=t.split("&"),a=0;a<n.length;a++)if(n[a].substring(0,n[a].indexOf("="))==e)return C(n[a].substring(n[a].indexOf("=")+1))}return""},expressInstallCallback:function(){if(J){var e=y(F);e&&E&&(e.parentNode.replaceChild(E,e),S&&(b(S,!0),X.ie&&X.win&&(E.style.display="block")),A&&A(N)),J=!1}}}}();
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


})(this);