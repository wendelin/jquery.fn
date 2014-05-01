(function($){
	var DEBUG = true;
	
	
	/**
	 * Get a media stream.
	 * Currently only user media streams are supported
	 *
	 * If successful the deferred object is resolved with the MediaStream.
	 *
	 * options:
	 * - "video" Shorthand for {video:true}
	 * - "audio" Shorthand for {audio:true}
	 * - video {Boolean} Local video stream (aka Webcam)
	 * - audio {Boolean} Local audio stream (aka Microphone)
	 *
	 * @public
	 * @method $.stream
	 * @param options {Object} Options: video, audio
	 * @returns {Object} $.Deferred instance that when successful reuturns the MediaStream
	 */
	$.stream = (function(){
		/**
		 * THis is junk, ignore it
		 * 
		 * @junk
		 * @TODO clean up code, use $.proxy
		 */
		var nav = navigator,
			getUserMedia = (
				nav.getUserMedia
				|| nav.webkitGetUserMedia
				|| nav.mozGetUserMedia
				|| nav.msGetUserMedia
			);
		
		if (getUserMedia) return (function(options){
			if (DEBUG) console.info("$.stream", options);
			options = (
				$.isPlainObject(options)
				? {
					video: !!options.video,
					audio: !!options.audio
				}
				: {
					video: options === "video",
					audio: options === "audio"
				}
			);
			
			var def = $.Deferred();
			try {
				getUserMedia.call(nav,
					options,
					function (stream) {def.resolve(stream);},
					function (err) {def.reject(err);}
				);
			} catch (err) {
				def.reject(err);
			}
			return def;
		});
		
		$.error("Browser does not support: getUserMedia");
	}());
	
	
	/**
	 * @WIP
	 * 
	 * options:
	 * - duration {Integer} Duration of recording session (milliseconds)
	 * - buffer {Integer} Buffer duration (milliseconds)
	 *
	 * @public
	 * @method $.stream.record
	 * @param stream {MediaStream}
	 * @param options {Object}
	 * @returns {Object} $.Deferred instance
	 */
	// WIP
	$.stream.record = function (stream, duration) {
		var recorder = new MediaRecorder(stream),
			def = new $.Deferred();
		recorder.ondataavailable = function(e){
			var blob = e.data;
			def.resolve(blob);
		};
		recorder.onstop = function(){
			recorder.ondataavailable = null;
		};
		recorder.onerror = def.reject;
		setTimeout(function(){
			recorder.stop();
		}, duration);
		recorder.start();
		return def;
	};
	/*
console.clear();
$("video")
.stream({video:true,audio:true},{autoplay:true})
.queue(function(){
    var stream = this.mozSrcObject
    console.log(stream);
    $.stream.record(stream,5000)
    .then(function(blob){
        $.blob.save(blob);
        stream.stop();
    }, console.warn);
});
*/
	
	
	/* This Works
console.clear();
$.when(window._stream || $.stream({video:true,audio:true}))
.then(function(stream){
    window._stream = stream;
    console.log(stream);
    var recorder = new MediaRecorder(stream);
    recorder.ondataavailable = function(e){
        var blob = e.data;
        console.log(blob);
        $.blob.save(blob);
        console.log(recorder);
    };
    recorder.onstop = function(e){
        recorder.ondataavailable = null;
    };
    console.log(recorder);
    recorder.start(/ *buffersize* /);
    setTimeout(function(){
        recorder.stop();
    },5000);
});"";
	*/
	
	
	$.extend($.stream, {
		attach: (function(){
			return (
				("mozSrcObject" in document.createElement("video"))
				? function (target, stream) {
					if (DEBUG) console.info("$.stream.attach", target, stream);
					$(target).prop("mozSrcObject", stream);
				}
				: function (target, stream) {
					if (DEBUG) console.info("$.stream.attach", target, stream);
					$(target)
						.data("MediaStream", stream)
						.prop("src",
							(window.URL || window.webkitURL).createObjectURL(stream)
						);
				}
			);
		}()),
		stop: (function(){
			return (
				("mozSrcObject" in document.createElement("video"))
				? function (target) {
					if (DEBUG) console.info("$.stream.stop", target);
					$(target).each(function(){
						if (this.mozSrcObject) {
							this.mozSrcObject.stop();
							this.mozSrcObject = null;
						}
					});
				}
				: function (target) {
					if (DEBUG) console.info("$.stream.stop", target);
					var stream = $(target).data("MediaStream"),
						src = target.src;
					if (stream) stream.stop();
					if (src) URL.revokeObjectURL(src);
				}
			);
		}())
	});
	
	
	
	
	
	
	/* DEPRECATED!
	 * Get user media, i.e. get user's webcam &/| microphone
	 * Options:
	 * - video: get webcam
	 * - audio: get microphone
	 *
	 * See:
	 * https://developer.mozilla.org/en-US/docs/Web/API/Navigator.getUserMedia
	 *
	 * @method $.getUserMedia
	 * @param constraints {Object} Options: video, audio
	 * @returns {$.Deferred}
	$.getUserMedia = (function(){
		var nav = navigator,
			getUserMedia = (
				nav.getUserMedia
				|| nav.webkitGetUserMedia
				|| nav.mozGetUserMedia
				|| nav.msGetUserMedia
			);
		
		if (getUserMedia) return (function(constraints){
			var def = $.Deferred();
			try {
				getUserMedia.call(
					nav,
					constraints,
					function (stream) {
						def.resolve(stream);
					},
					function (err) {
						def.reject(err);
					}
				);
			} catch (err) {
				def.reject(err);
			}
			return def;
		});
		
		$.error("Browser does not support: getUserMedia");
	}());
	 */

/*
Warning note:
User media streams should be stopped if they are not to be used anymore.

$.getUserMedia({video:true})
.then(function(stream){
    console.log(stream);
    setTimeout(function(){stream.stop()},3000);
    return stream;
})
.then(console.info,console.warn)
*/
	
	
	$.fn.extend({
		
		/**
		 *
		 * Define stream:
		 *     $("video").stream({video:true, audio:true}, {autoplay:true, muted:true})
		 *     $("video").stream("video", true)
		 *     $("audio").stream("audio", true)
		 *
		 * 
		 * Control stream:
		 *     $("video").stream("play")
		 *     $("video").stream("pause")
		 *     $("video").stream("stop")
		 *
		 * @method $.fn.stream
		 * @param stream {MediaStream || Object {video,audio || "video" || "audio"}
		 * @param options {Object} Options: autoplay, muted
		 * @param qType {Scalar} jQuery queue type
		 * @chainable
		 */
		stream: function (stream, options, qType) {
			options = $.isPlainObject(options) ? options : {autoplay:!!options};
			qType = qType || "fx";
			
			if (DEBUG) console.info("$.fn.stream", this, stream, options, qType);
			
			if (stream instanceof MediaStream) {
				$.mediaStream.attach(this, stream);
				return this.attr(options);
			}
			
			if (stream === "stop") {
				$.stream.stop(this);
				return this;
			}
			
			if (/^(play|pause|load)$/.test(stream)) {
				return this.each(function(){
					this[stream]();
				});
			}
			
			var def = $.stream(stream);
			return this.queue(qType, function(){
				var el = this,
					$el = $(el);
				def.then(function(stream){
					if ($el.is("video,audio")) {
						$.stream.attach($el.empty().prop(options), stream);
					}
					$.dequeue(el, qType);
				}, function (){
					$.dequeue(el, qType);
				});
			});
		}
	});
	
}(jQuery));