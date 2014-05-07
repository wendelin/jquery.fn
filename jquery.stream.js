/**
 * @copyright Copyright 2014 Wendelin Thomas. All rights reserved
 * Licensed under the MIT License.
 * @see https://github.com/wendelin/jquery.fn/blob/gh-pages/LICENSE.md
 */


(function($){
	var DEBUG = true;
	
	
	/**
	 * <p>Get a media stream.</p>
	 * <p>Currently only user media streams are supported</p>
	 *
	 * <p>If successful the deferred object is resolved with the MediaStream.</p>
	 *
	 * <p>Options:</p>
	 * <dl>
	 *   <dt>"video"</dt>         <dd>Shorthand for {video:true}</dd>
	 *   <dt>"audio"</dt>         <dd>Shorthand for {audio:true}</dd>
	 *   <dt>video {Boolean}</dt> <dd>Local video stream (aka Webcam)</dd>
	 *   <dt>audio {Boolean}</dt> <dd>Local audio stream (aka Microphone)</dd>
	 * </dl>
	 *
	 * @public
	 * @method $.stream
	 * @param {Object} options Options: video, audio
	 * @returns {Object} $.Deferred instance that when successful returns the MediaStream
	 */
	$.stream = (function(){
		/**
		 * @todo clean up code, use $.proxy
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
	 * <p>Record a MediaStream.</p>
	 *
	 * <p><Options:</p>
	 * <dl>
	 *   <dt>duration {Integer}</dt> <dd>Duration of recording session (milliseconds)</dd>
	 *   <dt>buffer {Integer}</dt>   <dd>Buffer duration (milliseconds)</dd>
	 * </dl>
	 *
	 * @todo Debug this in multiple different browsers.
	 *
	 * @example // Record 5 seconds of video and audio using FireFox
	 * $("video")
	 * .stream({video:true,audio:true},{autoplay:true})
	 * .queue(function(){
	 *     var stream = this.mozSrcObject
	 *     console.log(stream);
	 *     $.stream.record(stream,5000)
	 *     .then(function(blob){
	 *         $.blob.save(blob);
	 *         stream.stop();
	 *     }, console.warn);
	 * });
	 *
	 * @example // Record 5 seconds of video and audio.
	 * $.stream({video:true,audio:true})
	 * .then(function(stream){
	 *     $.stream.record(stream,5000)
	 *     .then(function(blob){
	 *         $.blob.save(blob);
	 *         stream.stop();
	 *     }, console.warn);
	 * }, console.warn);
	 *
	 * @public
	 * @method $.stream.record
	 * @param {MediaStream} stream
	 * @param {Object} options
	 * @returns {Object} $.Deferred instance
	 */
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
	
	
	$.extend($.stream, {
		/**
		 * Attach MediaStream
		 *
		 * @method $.stream.attach
		 * @param {HTMLVideoElement|HTMLAudioElement|jQuery.<(HTMLVideoElement|HTMLAudioElement)>} target
		 * @param {MediaStream} stream
		 */
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
		
		/**
		 * Stop MediaStream
		 *
		 * @method $.stream.stop
		 * @param {HTMLVideoElement|HTMLAudioElement|jQuery.<(HTMLVideoElement|HTMLAudioElement)>} target
		 */
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
	 * @param {Object} constraints Options: video, audio
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
		 * @example // Define stream:
		 * $("video").stream({video:true, audio:true}, {autoplay:true, muted:true})
		 * $("video").stream("video", true)
		 * $("audio").stream("audio", true)
		 * 
		 * 
		 * @example // Control stream:
		 * $("video").stream("play")
		 * $("video").stream("pause")
		 * $("video").stream("stop")
		 *
		 * @method $.fn.stream
		 * @param {
		 *   MediaStream
		 *   |Object.<{video:Boolean,audio:Boolean}>
		 *   |String.<{"video","audio"}>
		 * } stream
		 * @param {Object} options Options: autoplay, muted
		 * @param {Scalar} qType jQuery queue type
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