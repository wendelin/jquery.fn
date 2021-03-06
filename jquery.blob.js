/**
 * @copyright Copyright 2014 Wendelin Thomas. All rights reserved
 * Licensed under the MIT License.
 * @see https://github.com/wendelin/jquery.fn/blob/gh-pages/LICENSE.md
 * @requires jquery
 * @requires jquery.dataURL
 * @module jquery.blob
 */
(function (factory) {

if (typeof define === "function" && define.amd) {
	// AMD. Register as a module depending on jQuery.
	define("jquery.blob",["jquery","jquery.dataURL"], factory);
} else {
	// No AMD. Register plugin with global jQuery object.
	factory(jQuery);
}
}(function ($) {
	"use strict";
	
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
	 * <p>Get a Blob<p>
	 *
	 * <p>Options:<p>
	 * <dl>
	 *   <dt>multiple {Boolean}</dt> <dd>override, force support for multiple files from single source => see: &lt;input type="file" multiple /&gt;</dd>
	 *   <dt>async {Boolean}</dt>    <dd>Wrap response in a $.Deferred</dd>
	 *   <dt>type {String}</dt>      <dd>Image mimetype to default to or if (convert) to enforce</dd>
	 *   <dt>convert {Boolean}</dt>  <dd>Conversion to be forced: image mimeType and width && height</dd>
	 *   <dt>width {Integer}</dt>    <dd>Resize image width</dd>
	 *   <dt>height {Integer}</dt>   <dd>Resize image height</dd>
	 * </dl>
	 *
	 * @method $.blob
	 * @param {File|Blob|HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} source
	 * @param {Object} options Options: multiple, convert, async, width, height, type
	 * @returns {Blob|File|$.Deferred}
	 */
	$.blob = function (source, options) {
		if ($.blob.debug && window.console && console.info) console.info("$.blob", source, options);
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
				if (options.convert) {
					if (!options.async) $.error("Blob conversion can only be done asynchronously");
					output = $.blob.convert(source, options)
					options.convert = false;	// convert handled
				} else {
					output = source;
				}
				break;
			
			// if source is HTMLImageElement using a dataURL, grab dataURL.
			case (source && source.tagName && source.tagName.toLowerCase() === "img" && source.src && /^data:/.test(source.src)):
				source = source.src;
				
			case ($.dataURL.is(source)):
				if (options.convert) {
					if (!options.async) $.error("dataURL conversion can only be done asynchronously");
					output = (
						$.draw.url2canvas(source, document.createElement("canvas"), options)
						.then(function(canvas){
							return $.blob.fromCanvas(canvas, options)
						})
					);
					options.convert = false;	// convert handled
				} else {
					output = $.dataURL.toBlob(source);
				}
				break;
			
			case ($(source).is('input[type="file"]')):
				source = $.makeArray($(source).prop("files"));
				// NO BREAK, continue to next
			case ($.isArray(source)):
				output = (
					(options.multiple)
					? $.map(source, function (v, i) {
						return $.blob(v, options);
					})
					: (
						$.blob(source[0], options)
					)
				);
				options.convert = false;	// convert handled
				break;
			
			case ($(source).is("canvas") && ! options.convert):
				output = $.blob.fromCanvas(source, options.type, options.quality);
				options.convert = true;
				break;
				
			case ($(source).is("img,canvas,video")):
				output = (
					$.blob.fromCanvas(
						$.draw.element2canvas(source, document.createElement("canvas"), options),
						{type:options.type, quality:options.quality}	// no "async"
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
	$.extend($.blob, {
		/**
		 * Debug toggler
		 *
		 * @parameter $.blob.debug
		 * @type {Number}
		 * @default 0
		 */
		debug: 0,
		
		/**
		 * File/Blob URL.
		 * This method makes it possible to get a direct reference to a Blob/File.
		 * No conversion to dataURL is needed. This should translate into better
		 * performance (less memory & time).
		 *
		 * @method $.blob.createURL
		 * @param {File|Blob} blob
		 * @returns {String}
		 */
		createURL: function (blob) {
			return (window.URL || window.webkitURL).createObjectURL(blob);
		},
		
		/**
		 * Revoke File/Blob URL.
		 * When a File/Blob URL is no longer needed it should be revoked to clear
		 * memory.
		 *
		 * Counterpart to: $.blob.createURL
		 *
		 * @method $.blob.revokeURL
		 * @param {File|Blob} blob
		 * @returns {String}
		 */
		revokeURL: function (url) {
			return (window.URL || window.webkitURL).revokeObjectURL(url);
		},
		
		/**
		 * <p>File/Blob size getter</p>
		 * <p>Getting the size of a blob in bytes is best done directly (blob.size).<br />
		 * This method has the advantage that it can convert the bytes value into
		 * a human readable format.</p>
		 *
		 * @example $.blob.size(new Blob(["Hello World!"]), true);
		 *
		 * @method $.blob.size
		 * @param {File|Blob} blob
		 * @param {Boolean=} humanReadable
		 * @returns {String}
		 */
		size: function (blob, humanReadable) {
			return (humanReadable ? _readablizeBytes(blob.size) : blob.size);
		},
		
		/**
		 * Get Blob from HTMLCanvasElement.
		 *
		 * @method $.blob.fromCanvas
		 * @param {HTMLCanvasElement} canvas
		 * @param {Object.<({
		 *   async:Boolean.<({true})>,
		 *   type:String.<({
		 *     "image/jpeg",
		 *     "image/webp"
		 *   })>,
		 *   quality:Integer
		 * })>=} options
		 * @returns {$.Deferred instance}
		 */
		fromCanvas: function (canvas, options) {
			if ($.blob.debug > 2 && window.console && console.log) console.log("$.blob.fromCanvas", canvas, options);
			if (!options || !options.async) $.error("$.blob." + method + ": Cannot do synchronously!");
			canvas = (canvas instanceof $) ? canvas.get(0) : canvas;
			options = options || {};
			var def = new $.Deferred();
			try {
				(
					(/^image\/(jpeg|webp)$/.test(options.type))
					? canvas.toBlob(def.resolve, options.type, ((options.quality||1)/1))
					: canvas.toBlob(def.resolve, options.type)
				);
			} catch (err) {
				def.reject(err);
			}
			return def;
		},
		
		/**
		 * Blob/File converter that supports changing of type & dimensions.
		 *
		 * @see $.draw.blob2canvas
		 *
		 * @method $.blob.convert
		 * @param {File|Blob} blob
		 * @param {Object} options Options: async, width, height, scale, type
		 * @returns {File|Blob|$.Deferred}
		 */
		convert: function (blob, options) {
			if ($.blob.debug > 0 && window.console && console.log) console.log("$.blob.convert", blob, options);
			options = options || {};
			if (!options.async) $.error("$.blob.convert: Cannot convert blob synchronously.");
			
			return (
				$.draw.blob2canvas(blob, document.createElement("canvas"), options)
				.then(function(canvas){
					return $.blob.fromCanvas(canvas, options)
				})
			);
			
			
			/**
			 * @todo Cleanup
			 */
			/* JUNK - perhaps some can be recycled
			var def = $.Deferred(),
				stack = $.draw.blob2canvas(blob, document.createElement("canvas"), options);
			
			var resolve = (blob instanceof File) ? function (newBlob) {
				var oldSuffix = blob.type.split("/")[1],
					newSuffix = newBlob.type.split("/")[1];
				
				if (oldSuffix === "jpeg") oldSuffix = "jpg";
				if (newSuffix === "jpeg") newSuffix = "jpg";
				
				try {	// attempt to give the blob a name, this might not work but it is worth a try
					newBlob.name = (
						oldSuffix === newSuffix
						? blob.name
						: blob.name.replace(new RegExp("." + oldSuffix +"$"), "." + newSuffix)
					);
				} catch (err) {
					if (window.console && console.warn) console.warn(err);
				}
				
				def.resolve(newBlob);
			} : def.resolve;
			
			stack.then(function(canvas){
				try {
					canvas.toBlob(resolve, options.type, options.quality||1);
				} catch (err) {
					def.reject(err);
				}
			}, def.reject, def.notify);
			
			return def;
			*/
		},
		
		/**
		 * Force the browser to try to save a given blob.
		 * 
		 * @example $.blob.save(new Blob(["Hello World!"]), "hello.txt");
		 * 
		 * @see http://stackoverflow.com/questions/18925210/download-blob-content-using-specified-charset
		 * @see http://msdn.microsoft.com/en-us/library/ie/hh779016%28v=vs.85%29.aspx
		 * @see http://hackworthy.blogspot.com/2012/05/savedownload-data-generated-in.html
		 * 
		 * @method $.blob.save
		 * @param {File|Blob} blob
		 * @param {String} name
		 */
		save: (function(){
			var fn = (navigator.msSaveBlob && $.proxy(navigator.msSaveBlob, navigator) || function (blob, name) {
				var url =  $.blob.createURL(blob);
				$.dataURL.save(url, name || blob.name);
				setTimeout(function () {
					$.blob.revokeURL(url);
				}, 250);
			});
			return (function (blob, name) {
				if ($.blob.debug && window.console && console.info) console.info("$.blob.save", blob, name);
				return fn(blob, name || blob.name || blob.type.replace("/","."));
			})
		}()),
		
		/**
		 * Type test, supports general type testing ("image","audio","video",...) and
		 * specific type testing ("application/zip", "image/png", "image/jpeg",...).
		 *
		 * @example $.blob.is(new Blob(["Hello World!"]));
		 * @example $.blob.is("wrong", "image");
		 * @example $.blob.is(null, "image/png");
		 *
		 * @method $.blob.is
		 * @param {Blob|File} blob Valid blob or file
		 * @param {String} str Test string
		 * @returns {Boolean}
		 */
		is: function (blob, str) {
			return (
				!! blob
				&& blob instanceof Blob
				&& (
					!str
					|| (
						(str.indexOf("/") === -1)
						? (new RegExp("^" + str + "\/")).test(blob.type)
						: str === blob.type
					)
				)
			);
		},
		
		/**
		 * Return the name associated with the blob.
		 * If none exists attempt to generate one and when not running in readOnly mode
		 * stamp that name onto that blob.
		 * 
		 * Sidenote: Hal refused to let me call this method "name".
		 * 
		 * @method $.blob.stamp
		 * @param {Blob|File} blob
		 * @param {Boolean} readOnly
		 * @returns {String}
		 */
		stamp: function (blob, readOnly) {
			if (blob instanceof Blob) {
					if (!("name" in blob)) {
						var name = {
							"image/jpeg":"image.jpg",
							"image/gif":"image.gif",
							"image/png":"image.png"
						}[blob.type];
						
						if (name && !readOnly) blob.name = name;
					}
				if ("name" in blob) return blob.name;
			}
		}
	});
	
	/*
	 * Wrapped FileReader methods
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileReader
	 */
	
	/**
	 * @method $.blob.readAsArrayBuffer
	 * @param {File|Blob} blob
	 * @param {Object=} options
	 * @returns {$.Deferred}
	 */
	
	/**
	 * @method $.blob.readAsBinaryString
	 * @param {File|Blob} blob
	 * @param {Object=} options
	 * @returns {$.Deferred}
	 */
	
	/**
	 * @method $.blob.readAsDataURL
	 * @param {File|Blob} blob
	 * @param {Object=} options
	 * @returns {$.Deferred}
	 */
	
	/**
	 * @method $.blob.readAsText
	 * @param {File|Blob} blob
	 * @param {Object=} options
	 * @returns {$.Deferred}
	 */
	$.each(["readAsArrayBuffer","readAsBinaryString","readAsDataURL","readAsText"], function(i, method){
		$.blob[method] = function(blob, options){
			if ($.blob.debug > 0 && window.console && console.log) console.log("$.blob." + method, blob, options);
			if (!options || !options.async) $.error("$.blob." + method + ": Cannot do synchronously!");
			var def = $.Deferred(),
				reader = new FileReader();
			try {
				reader.onload = function (e) {
					def.resolve(e.target.result);
				};
				reader.onerror = function (err) {
					def.reject(err);
				};
				reader[method](blob);
			} catch (err) {
				def.reject(err);
			}
			return def;
		}
	});
	
	/**
	 * <p>Get a single Blob or array of Blob[s].</p>
	 * 
	 * <p>Options:
	 *   <dt>multiple {Boolean}</dt> <dd>Return array of Blob[s]</dd>
	 *   <dt>async {Boolean}</dt>    <dd>Async mode (enables File and Blob sources) method will return $.Deferred for chaining</dd>
	 *   <dt>type {String}</dt>      <dd>MimeType to be used when drawing img[s]</dd>
	 *   <dt>convert {Boolean}</dt>  <dd>Conversion to be forced: image type and width && height</dd>
	 *   <dt>width {Integer}</dt>    <dd>Resize width</dd>
	 *   <dt>height {Integer}</dt>   <dd>Resize height</dd>
	 *   <dt>scale {Boolean}</dt>    <dd>Resize scaling/keep aspect ratio when resizing</dd>
	 *   <dt>quality {Integer}</dt>  <dd>Image quality</dd>
	 * </dl>
	 *
	 * @example // Get array of File[s] for all upload fields:
	 *   $('input[type="file"]').blob({multiple:true});
	 * @example // Get array of Blob[s] forcibly converted from all upload fields (only works with images)
	 * $('input[type="file"][multiple]')
	 *    .blob({convert:true, async:true, multiple:true, width:40, scale:true})
	 * @example $("img").blob({multiple:true});
	 * @example $('input[type="file"][multiple]')
	 *   .blob({multiple:true,convert:true,async:true,type:"image/jpeg",width:100,scale:true})
	 * @method $.fn.blob
	 * @param {Object} options Options: multiple, async, type, convert, width, height, scale
	 * @returns {Blob|File|$.Deferred}
	 */
	$.fn.blob = function (options) {
		if ($.blob.debug && window.console && console.info) console.info("$.fn.blob", this, options);
		if (options && options.multiple) {
			var arr = [];
			this.each(function(){
				arr.push($.blob(this, options));
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
			return $.blob(this.filter(":first"), options);
		}
	};
	
	return $;
}));