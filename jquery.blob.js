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
	// AMD. Register as an anonymous module depending on jQuery.
	define("jquery.blob",["jquery"], factory);
} else {
	// No AMD. Register plugin with global jQuery object.
	factory(jQuery);
}
}(function ($) {
	var DEBUG = false;
	
	
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
		options = options || {type:null, async:false, multiple: false, convert:false};
		
		var $source = $(source).first(),
			source = $source.get("0"),
			stack;
		
		if (source instanceof Blob) stack = [source];
		else if ($source.is('img[src^="data:"]')) stack = [$.dataURL.toBlob(source.src)]
		else if ($source.is('input[type="file"]')) stack = $.makeArray(source.files);
		else if (!$source.is("canvas")) {
			stack = [$.dataURL.toBlob(
				$.dataURL.fromCanvas(
					$.draw.element2canvas(source, document.createElement("canvas"), options),
					options
				)
			)];
			options.convert = false;	// No conversion needed, all convert possibilities covered here
		}
		else {
			stack = [$.dataURL.toBlob(
				$.dataURL.fromCanvas(source, options.type, options.quality)
			)];
			options.type = options.quality = null;	// Any quality / type conversion is done
		}
		
		if (options.async) {
			if (!options.multiple) stack = stack.slice(0,1);
			
			if (options.convert) {
				stack = $.map(stack, function(blob){
					return $.blob.convert(blob,options);
				});
			}
			return $.when.apply($.when, stack);
			
		} else if (options.convert) {
			$.error("$.blob: forced conversion of source (" + source + ") cannot be done synchronously");
		}
		
		return options.multiple ? stack : stack[0];

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