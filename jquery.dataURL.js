/**
 * @todo Bugfix & Cleanup
 * @copyright Copyright 2014 Wendelin Thomas. All rights reserved
 * Licensed under the MIT License.
 * @see https://github.com/wendelin/jquery.fn/blob/gh-pages/LICENSE.md
 * @requires jquery
 * @module jquery.dataURL
 */
(function (factory) {
if (typeof define === "function" && define.amd) {
	// AMD. Register as an anonymous module depending on jQuery.
	define("jquery.dataURL",["jquery"], factory);
} else {
	// No AMD. Register plugin with global jQuery object.
	factory(jQuery);
}
}(function ($) {
	

	/**
	 * Convert number of bytes to human readable format.
	 * 
	 * @private
	 * @function _readablizeBytes
	 * @param {Number} bytes
	 * @returns {String}
	 */
	var _readablizeBytes = function (bytes) {
		var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
			e = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
	};

	/**
	 * <p>Get dataURL[s]</p>
	 * 
	 * <p>Options:</p>
	 * <dl>
	 *   <dt>multiple {Boolean}</dt> <dd>override, force support for multiple files from single source => see: &lt;input type="file" multiple /&gt;</dd>
	 *   <dt>async {Boolean}</dt>    <dd>Wrap response in a $.Deferred</dd>
	 *   <dt>type {String}</dt>      <dd>Image mimetype to default to or if (convert) to enforce</dd>
	 *   <dt>convert {Boolean}</dt>  <dd>Conversion to be forced: image mimeType and width && height</dd>
	 *   <dt>width {Integer}</dt>    <dd>Resize image width</dd>
	 *   <dt>height {Integer}</dt>   <dd>Resize image height</dd>
	 * </dl>
	 *
	 * @method $.dataURL
	 * @param {File|Blob|HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} source
	 * @param {Object=} options Options: multiple, convert, async, width, height, type
	 * @returns {URL|$.Deferred}
	 */
	$.dataURL = function (source, options) {
		if ($.dataURL.debug && window.console && console.info) console.info("$.dataURL", source, options);
		options = $.extend({type:null, async:false, multiple: false, convert:false}, options || {})
		
		// Unwrap source if needed
		source = (
			(source instanceof $)
			? source.get(0)
			: source
		);
		
		var output;
		
		switch (true) {
			case (source instanceof Blob):
				if (!options.async) $.error("Blob handling can only be done asynchronously");
				
				output = (
					options.convert
					? $.draw.blob2canvas(source, document.createElement("canvas"), options)
						.then(function(canvas){
							return $.dataURL.fromCanvas(canvas, options)
						})
					: $.blob.readAsDataURL(source, {async:true})
				);
				options.convert = false;	// convert handled
				break;
			
			// if source is HTMLImageElement using a dataURL, grab dataURL.
			case (source && source.tagName && source.tagName.toLowerCase() === "img" && source.src && /^data:/.test(source.src)):
				source = source.src;
				
			case ($.dataURL.is(source)):
				if (options.convert) {
					if (!options.async) $.error("dataURL handling can only be done asynchronously");
					output = (
						$.draw.url2canvas(source, document.createElement("canvas"), options)
						.then(function(canvas){
							return $.dataURL.fromCanvas(canvas, options)
						})
					);
					options.convert = false;	// convert handled
				} else {
					output = source;
				}
				break;
			
			case ($(source).is('input[type="file"]')):
				source = $.makeArray($(source).prop("files"));
				// NO BREAK, continue to next
			case ($.isArray(source)):
				output = (
					(options.multiple)
					? $.map(source, function (v, i) {
						return $.dataURL(v, options);
					})
					: (
						$.dataURL(source[0], options)
					)
				);
				options.convert = false;	// convert handled
				break;
			
			case ($(source).is("canvas") && ! options.convert):
				output = $.dataURL.fromCanvas(source, options);
				options.convert = true;
				break;
				
			case ($(source).is("img,canvas,video")):
				output = (
					$.dataURL.fromCanvas(
						$.draw.element2canvas(source, document.createElement("canvas"), options),
						options
					)
				);
				options.convert = false;	// convert handled
				break;
				
			default:
				if (!options.async) $.error("source not supported");
				output = new $.Deferred();
				output.reject("source not supported: " + source);
		}
		
		// "multiple" option => force output into array
		if (options.multiple && !$.isArray(output)) {
			output = [output];
		}
		
		// async mode => force output into async wrapping
		if (options.async && !(output instanceof $.Deferred)) {
			output = (
				$.isArray(output)
				? $.when.apply($.when, output)
				: $.when(output)
			)
		}
		
		return output;
	};
	$.extend($.dataURL, {
		/**
		 * Get (data)URL from HTMLCanvasElement.
		 *
		 * @method $.dataURL.fromCanvas
		 * @param {HTMLCanvasElement} canvas
		 * @param {Object.<({
		 *   type:String,
		 *   quality:Integer
		 * })>=} options
		 * @param {String.<({
		 *   "image/jpeg",
		 *   "image/webp"
		 * })>=} options.type
		 * @returns {DataURL}
		 */
		fromCanvas: function (canvas, options) {
			if ($.dataURL.debug > 2 && window.console && console.log) console.log("$.dataURL.fromCanvas", canvas, options);
			canvas = (canvas instanceof $) ? canvas.get(0) : canvas;
			options = options || {};
			return (
				(/^image\/(jpeg|webp)$/.test(options.type))
				? canvas.toDataURL(options.type, ((options.quality||1)/1))
				: canvas.toDataURL(options.type)
			);
		},
		
		/**
		 * Attempt to get the mimeType of a given dataURL.
		 *
		 * @method $.dataURL.type
		 * @param {String} url
		 * @returns {String}
		 */
		type: function (url) {
			return url.split(',')[0].split(':')[1].split(';')[0];
		},
		
		/**
		 * Raw dataURL size (same as the length)
		 *
		 * @method $.dataURL.rawSize
		 * @param {String} url
		 * @param {Boolean=} humanReadable
		 * @returns {String}
		 */
		rawSize: function (url, humanReadable) {
			var bytes = url.length;
			return (humanReadable ? _readablizeBytes(bytes) : bytes);
		},
		
		/**
		 * Size of the dataURL's file.<br/>
		 * (It removes the type info and accounts for the bloat.)
		 *
		 * @method $.dataURL.size
		 * @param {String} url
		 * @param {Boolean=} humanReadable
		 * @returns {String}
		 */
		size: function (url, humanReadable) {
			var bytes = Math.round(url.split(',')[1].length*3/4);
			return (humanReadable ? _readablizeBytes(bytes) : bytes);
		},
		
		/**
		 * Convert a dataURL to a Blob object<br/>
		 * See: https://developer.mozilla.org/en-US/docs/Web/API/Blob
		 *
		 * @method $.dataURL.toBlob
		 * @param {String} url Valid dataURL
		 * @returns {Blob}
		 */
		toBlob: function (url) {
			var mime = url.split(',')[0].split(':')[1].split(';')[0],
				binary = atob(url.split(',')[1]), array = [];
			for(var i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
			return new Blob([new Uint8Array(array)], {type: mime});
		},
		
		/**
		 * Force the browser to try to save a given dataURL.<br/>
		 * Support for normal URLs is also added.
		 * 
		 * @todo Change @param {String=} "name" to @param {Object=} "options"
		 * This way "type" can also be supported
		 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
		 * 
		 * @method $.dataURL.save
		 * @param {URL} url Valid dataURL or URL
		 * @param {String=} name
		 */
		save: function (url, name) {
			var a = document.createElement("a");
			a.target = "_blank";
			a.download = name || (/^data:/.test(url) ? this.type(url).replace("/",".") : url.split("/").pop());
			a.href = url;
			var event = document.createEvent("MouseEvents");
			event.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(event);
		},
		
		/**
		 * Type test, supports general type testing ("image","audio","video",...) and
		 * specific type testing ("application/zip", "image/png", "image/jpeg",...).
		 *
		 * @example $.dataURL.is(null);
		 * @example $.dataURL.is("wrong", "image");
		 * @example $.dataURL.is("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "image/gif");
		 *
		 * @method $.dataURL.is
		 * @param {String} url Valid dataURL
		 * @param {String=} str Test string
		 * @returns {Boolean}
		 */
		is: function (url, str) {
			if (!(url && typeof(url) === "string" && /^data:/.test(url))) return false;
			var type = $.dataURL.type(url);
			return (
				(str && str.indexOf("/") === -1)
				? (new RegExp("^" + str + "\/")).test(type)
				: (
					(arguments.length === 2)
					? str === type
					: true
				)
			);
		}
	});
	
	/**
	 * <p>Get a single dataURL or array of dataURL[s].</p>
	 *
	 * <p>Options:</p>
	 * <dl>
	 *   <dt>multiple {Boolean}</dt> <dd>Return array of Blob[s]</dd>
	 *   <dt>async {Boolean}</dt>    <dd>Async mode (enables File and Blob sources) method will return $.Deferred for chaining</dd>
	 *   <dt>type {String}</dt>      <dd>MimeType to be used when drawing img[s]</dd>
	 *   <dt>convert {Boolean}</dt>  <dd>Conversion to be forced: image mimeType and width && height</dd>
	 *   <dt>width {Integer}</dt>    <dd>Resize width</dd>
	 *   <dt>height {Integer}</dt>   <dd>Resize height</dd>
	 *   <dt>scale {Boolean}</dt>    <dd>Resize scaling/keep aspect ratio when resizing</dd>
	 * </dl>
	 *
	 * @example $('input[type="file"]').dataURL({multiple:true});
	 *
	 * @method $.fn.dataURL
	 * @param {Object} options Options: multiple, async, type, convert, width, height, scale
	 * @returns {Object} $.Deferred instance
	 */
	$.fn.dataURL = function (options) {
		if ($.dataURL.debug && window.console && console.info) console.info("$.fn.dataURL", this, options);
		if (options && options.multiple) {
			var arr = [];
			this.each(function(){
				arr.push($.dataURL(this, options));
			});
		
			/*
			 * Flatten.
			 * Since HTMLInputElements of the type file can have multiple files this is necessary
			 * to ensure we get a nice array of Blobs (& Files) without any nested arrays of Files.
			 */
			if (options.async) {
				var def = $.Deferred();
				$.when.apply($, arr)
				.then(
					function () { def.resolve($.map(arguments, function(n) {return n})); },
					function () { def.reject.apply(def, arguments); }
				);
				return def;
			
			} else {
				return $.map(arr, function(n) {return n});
			}
		
		} else {
			return $.dataURL(this.filter(":first"), options);
		}
	};
	
	return $;
}));