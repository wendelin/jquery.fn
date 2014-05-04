(function($){
	var DEBUG = true;
	
	$.fn.extend({

		/**
		 * <p>This method is used to control media elements (&lt;video&gt;,&lt;audio&gt;).<p>
		 * 
		 * <p>Note:<br/>
		 *     There is no support for File|Blob objects!</p>
		 *
		 * @example Defining single media file:
		 *     $("video).media({src:"movie.mp4",type:'audio/mp4; codecs="mp4a.40.2"'})
		 * 
		 * @example Define multiple (alternative) media files:
		 *     $("video").media([
		 *         {src:"movie.ogg", type:'video/ogg; codecs="theora, vorbis"'},
		 *         {src:"movie.mp4", type:'video/mp4; codecs="avc1.4D401E, mp4a.40.2"'}
		 *     ]);
		 * 
		 * @example Control media:
		 *     $("video").media("play");
		 *     $("video").media("pause");
		 *     $("video").media("load");		// No idea whether keeping this makes much sense.
		 *
		 *
		 * @method $.fn.media
		 * @param {URL|Array|Object} media Media source: single src, multiple src
		 * @param {Object} options Options: autoplay, muted
		 * @param {Scalar=} qType jQuery queue type
		 * @chainable
		 */
		media: function (media, options, qType) {
			if (!this.is("video,audio")) return this;
			qType = qType || "fx";
			
			// Call synchronous method (no queue is really needed)
			if (/^(play|pause|load)$/.test(media) && !options) {
				if (DEBUG) console.info("$.fn.media", this, media, options, qType);
				return this.queue(qType, function(){
					if (this[media]) this[media]();
					$.dequeue(this, qType);
				});
			}
			
			// Allow shorthand: $("video").media({....}, true);
			options = $.isPlainObject(options) ? options : {autoplay:!!options};
			
			if (DEBUG) console.info("$.fn.media", this, media, options, qType);
			
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
		}
	});
}(jQuery));