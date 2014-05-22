/**
 * @copyright Copyright 2014 Wendelin Thomas. All rights reserved
 * Licensed under the MIT License.
 * @see https://github.com/wendelin/jquery.fn/blob/gh-pages/LICENSE.md
 * @requires jquery
 * @module jquery.media
 */
(function (factory) {
if (typeof define === "function" && define.amd) {
	// AMD. Register as an anonymous module depending on jQuery.
	define("jquery.media",["jquery"], factory);
} else {
	// No AMD. Register plugin with global jQuery object.
	factory(jQuery);
}
}(function ($) {
	
	/**
	 * <p>This method is used to control media elements (&lt;video&gt;,&lt;audio&gt;).<p>
	 * 
	 * <p>Note:<br/>
	 *     There is no support for File|Blob objects! (...yet)</p>
	 *
	 * @example // Defining single media file:
	 * $("video").media({src:"movie.mp4",type:'audio/mp4; codecs="mp4a.40.2"'})
	 * 
	 * @example // Define multiple (alternative) media files:
	 * $("video").media([
	 *     {src:"movie.ogg", type:'video/ogg; codecs="theora, vorbis"'},
	 *     {src:"movie.mp4", type:'video/mp4; codecs="avc1.4D401E, mp4a.40.2"'}
	 * ]);
	 * 
	 * @example $("video").media("play"); // Play media:
	 *     
	 * 
	 * @example $("video").media("pause"); // Pause media:
	 * @example $("video").media("load"); // Load media - No idea whether keeping this makes much sense.:
	 * @todo Add support for <track>
	 *
	 *
	 * @method $.fn.media
	 * @param {URL|Array|Object} media Media source: single src, multiple src
	 * @param {Object} options Options: autoplay, muted
	 * @param {Scalar=} qType jQuery queue type
	 * @chainable
	 */
	$.fn.media = function (media, options, qType) {
		if (!this.is("video,audio")) return this;
		qType = qType || "fx";
		
		// Call synchronous method (no queue is really needed)
		if (/^(play|pause|load)$/.test(media) && !options) {
			// if (DEBUG) console.info("$.fn.media", this, media, options, qType);
			return this.queue(qType, function(){
				if (this[media]) this[media]();
				$.dequeue(this, qType);
			});
		}
		
		// Allow shorthand: $("video").media({....}, true);
		options = $.isPlainObject(options) ? options : {autoplay:!!options};
		
		// if (DEBUG) console.info("$.fn.media", this, media, options, qType);
		
		var sources = $.isArray(media) ? media : [media];
		
		return this.queue(qType, function(){
			var $this = $(this);
			if ($this.is("video, audio")) {
				$this.empty();
				$.each(sources, function(i,source){
					$("<source/>")
					.prop($.isPlainObject(source) ? source : {src:source})
					.appendTo($this);
				});
				$this.prop(options)
					.attr("src", null)	// remove any previous source
					.get(0).load();		// force it to load
			}
		});
	};
	
	return $;
}));