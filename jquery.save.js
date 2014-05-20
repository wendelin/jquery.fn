/**
 * @todo Bugfix & Cleanup
 * @copyright Copyright 2014 Wendelin Thomas. All rights reserved
 * Licensed under the MIT License.
 * @see https://github.com/wendelin/jquery.fn/blob/gh-pages/LICENSE.md
 * @requires jquery
 * @module jquery.save
 */
(function (factory) {
if (typeof define === "function" && define.amd) {
	// AMD. Register as an anonymous module depending on jQuery.
	define("jquery.save",["jquery"], factory);
} else {
	// No AMD. Register plugin with global jQuery object.
	factory(jQuery);
}
}(function ($) {
	
	/**
	 * <p>Save file</p>
	 *
	 * <p>Options:</p>
	 * <dl>
	 *   <dt>async {Boolean}</dt>   <dd>Wrap response in a $.Deferred</dd>
	 *   <dt>convert {Boolean}</dt> <dd>Conversion to be forced: image mimeType and width && height</dd>
	 *   <dt>type {String}</dt>     <dd>Image mimetype to default to or if (convert) to enforce</dd>
	 *   <dt>width {Integer}</dt>   <dd>Resize image width</dd>
	 *   <dt>height {Integer}</dt>  <dd>Resize image height</dd>
	 *   <dt>name {String}</dt>     <dd>File name to be used</dd>
	 * </dl>
	 *
	 * @method $.save
	 * @param {File|Blob|HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} source
	 * @param {Object=} options Options: convert, async, width, height, type, name
	 */
	$.save = function (source, options) {
		options = $.extend(options||{}, {async:true});
		
		if (options.convert) {
			$.blob(source, options).then(function(blob){
				$.blob.save(blob, options.name);
			});
		
		} else if ($.blob.is(item)) {
			$.blob.save(blob, options.name);
			
		} else if ($.dataURL.is(item)) {
			$.dataURL.save(item, name);
			
		} else {
			$(item).save({name:name});
		}
	};
		
	/**
	 * <p>Get a single Blob or array of Blob[s].<p>
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
	 * @example // Get array of File[s] for all upload fields:
	 *   $('input[type="file"]').blob({multiple:true});
	 *
	 * @method $.fn.save
	 * @param {Object} options Options: multiple, async, type, convert, width, height, scale
	 * @param {Scalar} qType jQuery queue type
	 * @returns {Object} $.Deferred instance
	 */
	$.fn.save = function (options, qType) {
		if (DEBUG) console.info("$.fn.save", this, options, qType);
		options = options || {};
		if (options.async) {
			qType = qType || "fx";
			var def = this.blob(options);
			def.done(function(blobs){
				if (!options.multiple) {
					blobs = [].concat(blobs);
				}
				$.each(blobs, function (i, blob) {
					$.blob.save(blob, options.name);
				});
			});
			this.queue(qType, function () {
				var el = this;
				def.always(function () {
					$.dequeue(el, qType);
				});
			});
		} else {
			$.blob.save(this.blob(options), options.name);
		}
		return this;
	};
}));