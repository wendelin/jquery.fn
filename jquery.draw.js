/**
 * @copyright Copyright 2014 Wendelin Thomas. All rights reserved
 * Licensed under the MIT License.
 * @see https://github.com/wendelin/jquery.fn/blob/gh-pages/LICENSE.md
 * @requires jquery
 * @module jquery.draw
 */
(function (factory) {
if (typeof define === "function" && define.amd) {
	// AMD. Register as an anonymous module depending on jQuery.
	define("jquery.draw",["jquery","jquery.blob","jquery.blob","jquery.dataURL","jquery.save"], factory);
} else {
	// No AMD. Register plugin with global jQuery object.
	factory(jQuery);
}
}(function ($) {
	"use strict";
	
	/**
	 * <p>Drawing method takes visual data from a single given source and "draws" it into each element
	 * of the context jQuery element set.<p>
	 *
	 * <p>Supported sources are:<p>
	 * <ul>
	 *   <li>HTMLVideoElement</li>
	 *   <li>HTMLCanvasElement</li>
	 *   <li>HTMLImageElement</li>
	 *   <li>File, containing imagery data that can be put into a HTMLImageElement</li>
	 *   <li>Blob, "</li>
	 *   <li>URL, any valid URL will do: dataURL, Blob URL, normal URL, whatever</li>
	 * </ul>
	 *
	 * <p>NOT supported sources are:</p>
	 * <ul>
	 *   <li>CSS selector // The only string inputs permitted are URLs (for now)</li>
	 * </ul>
	 *
	 * <p>Supported targets</p>
	 * <ul>
	 *   <li>HTMLCanvasElement</li>
	 *   <li>HTMLImageElement</li>
	 *  </ul>
	 *
	 * <p>Note:<br/>
	 *   If the source is a HTMLVideoElement then a video still image is taken and drawn into 
	 *   the target or each item in the target set.</p>
	 *
	 * <p>If successful the deferred object is resolved with the target.</p>
	 *
	 * <p>Options:</p>
	 * <dl>
	 *   <dt>type {String}</dt>       <dd>MimeType to be used when drawing img[s]</dd>
	 *   <dt>width {Integer}</dt>     <dd>Resize width</dd>
	 *   <dt>height {Integer}</dt>    <dd>Resize height</dd>
	 *   <dt>scale {Boolean}</dt>     <dd>Resize scaling/keep aspect ratio when resizing</dd>
	 *   <dt>async {Boolean}</dt>     <dd>Async mode (enables File and Blob sources) method will return $.Deferred for chaining</dd>
	 *   <dt>maxWidth {Integer}</dt>  <dd>Max width constraint</dd>
	 *   <dt>maxHeight {Integer}</dt> <dd>Max height constraint</dd>
	 * </dl>
	 *
	 * @method $.draw
	 * @param {URL|HTMLElement|jQuery-set|File|Blob} source
	 * @param {HTMLElement|jQuery-set} target If undefined a new HTMLCanvasElement is used
	 * @param {Object.<{
	 *   type:Scalar,
	 *   width:Integer,
	 *   height:Integer,
	 *   scale:Boolean,
	 *   async:Boolean,
	 *   maxWidth:Integer,
	 *   maxHeight:Integer
	 * }>=} options
	 * @returns {Object} target or if async=true $.Deferred instance that when successful returns the target
	 */
	$.draw = function (source, target, options) {
		if ($.draw.debug && window.console && console.info) console.info("$.draw", source, target, options);
		options = $.isPlainObject(options) ? options : {width:null, height:null, scale:true, type:options, async: false};
		source = (
			$.dataURL.is(source)
			? $.dataURL.toBlob(source)
			: (
				typeof(source) === "object"
				? $(source).get(0)	// Remove jQuery wrapping on source
				: source
			)
		);
		
		if (!$(target).is("img,canvas")) {
			$.error("$.draw: Target type not supported: " + target);
		}
		
		if (options.async) {
			var origTarget = target;	// Keep reference to original target to return it later
			
			if (source.tagName && /^(input|select|textarea)$/.test(source.tagName.toLowerCase())) {
				source = (
					source.type === "file"
					? source.files[0]
					: $(source).val()
				);
			}
			
			var def = new $.Deferred();
			
			var canvas;
			if ($(target).is("canvas")) {
				canvas = $(target).filter("canvas").get(0);
				target = $(target).not(canvas);
				if (!target.size()) target = null;
			} else {
				canvas = document.createElement("canvas");
			}
			
			try {
				source = (
					(source instanceof Blob)
					? $.draw.blob2canvas(source, canvas, options)
					: (
						(typeof(source) === "string")
						? $.draw.url2canvas(source, canvas, options)
						: $.draw.element2canvas(source, canvas, options)
					)
				);
			} catch (err) {
				return def.reject(err);
			}
			
			if (target) {
				$.when(source).then(function(canvas){
					try {
						var url = $.dataURL.fromCanvas(canvas, options);
					/*
					 * Catch:
					 * [
					 *     Exception... "The operation is insecure." 
					 *     code: "18"
					 *     nsresult: "0x80530012 (SecurityError)"
					 *     location: "<unknown>"
					 * ]
					 */
					} catch (err) {
						def.reject(err+"");
						return def;
					}
					var list = $(target).map(function(){
							var d = new $.Deferred();
							var debug = {el:this};
							d.notify(debug);
							this.onload = function () {
								d.resolve(this);
								debug.state = "resolved";
							}
							this.onerror = function (err) {
								d.reject(err+"");
								// debug.state = err;
							};
							this.src = url;
							
							return d;
						});
					
					$.when.apply($.when,list).then(function(){
						def.resolve(origTarget);
					}, def.reject, def.notify);
					
				}, def.reject, def.notify)
				
			} else {
				$.when(source).then(function(){
					def.resolve(origTarget);
				}, def.reject, def.notify);
			}
			
			return def;
		}
		
		/*
		 * Use proxy if target is not a canvas
		 */
		if (!$(source).is("canvas")) {
			try {
				source = $.draw.element2canvas(source, document.createElement("canvas"), options);
			} catch (err) {
				$.error(err + "\r" + '=> Try async mode if you want to use as source: Blob|File|input[type="file"]');
			}
		}
		
		$(target).attr("src",$.dataURL.fromCanvas(source, {
			type: options.type,
			quality: options.quality
		}));
		
		return target;
	};
	
	$.extend($.draw, {

		/**
		 * Draw an item onto a HTMLCanvasElement or a set of canvases.<br/>
		 * <strong>Supports resizing</strong>
		 *
		 * <p>Note it returns the canvas it gets.<br/>
		 * If the canvas given to it is a "raw" HTMLElement that that is what it returns. If it receives
		 * a jQuery set of one HTMLCanvasElement it returns that.</p>
		 *
		 * @private
		 * @method $.draw.element2canvas
		 * @param {HTMLVideo|HTMLCanvasElement|HTMLImageElement} item
		 * @param {HTMLCanvasElement|jQuery-Set-of-HTMLCanvasElements} canvas
		 * @param {Object.<({
		 *   width:Number,
		 *   height:Number,
		 *   maxWidth:Number,
		 *   maxHeight:Number,
		 *   scale:Boolean
		 * })>=} resize
		 * @returns {HTMLCanvasElement|jQuery-set-of-single-HTMLCanvasElement}
		 */
		element2canvas: function (item, canvas, resize) {
			if ($.draw.debug > 2 && window.console && console.log) console.log("$.draw.element2canvas", item, canvas, resize);
			
			var $item   = $(item),
				$canvas = $(canvas);
			
			item = $item.get(0);
			
			if ($.draw.debug > 3 && window.console && console.log) {
				try {
					console.log(" > original dimensions", {
						width : item.videoWidth  || item.width  || $item.width(),
						height: item.videoHeight || item.height || $item.height()
					});
				} catch (err) {
					console.log(" > original dimensions", err);
					$.error(err);
				}
			}
			
			resize = resize || {};
			
			var width, height;
			
			if ("scale" in resize && !resize.scale) {
				width  = resize.width  || item.width  || $item.width();
				height = resize.height || item.height || $item.height();
			
			} else {
				/*
				 * For video resizing use actual video dimensions rather then those of the HTMLVideoElement.
				 */
				var isVideoResize = $item.is("video") && (resize.width || resize.height);
				
				/*
				 * throw error if video element is "empty" (width & height == 0)
				 */
				if ($item.is("video") && !$item.prop("videoWidth")&& !$item.prop("videoHeight")) {
					$.error("HTMLVideoElement is empty!");
				}
				
				
				width  = (isVideoResize) ? item.videoWidth  : item.width  || $item.width();
				height = (isVideoResize) ? item.videoHeight : item.height || $item.height();
				
				/*
				 * TODO: Permit percent values for width & height
				if (/^\d+(\.\d+)?%$/.test(resize.width)) {
					resize.width = Math.round(width * (parseFloat(resize.width) / 100));
					if ($.draw.debug > 2 && window.console && console.log) console.log(" > resize.width", resize.width);
				}
				if (/^\d+(\.\d+)?%$/.test(resize.height)) {
					resize.height = Math.round(height * (parseFloat(resize.height) / 100));
					if ($.draw.debug > 2 && window.console && console.log) console.log(" > resize.height", resize.height);
				}
				*/
				
				if (resize.maxWidth && (resize.width||width) > resize.maxWidth){
					resize.width = resize.maxWidth;
				}
				
				if (resize.maxHeight && (resize.height||height) > resize.maxHeight){
					resize.height = resize.maxHeight;
				}
				
				if (resize.width || resize.height) {
					var ratioWidth  = 0,
						ratioHeight = 0;
					
					if (resize.width > 0)  ratioWidth  = width  / resize.width;
					if (resize.height > 0) ratioHeight = height / resize.height;
				
					if (ratioWidth > ratioHeight) {
						width  /= ratioWidth;
						height /= ratioWidth;
					} else {
						width  /= ratioHeight;
						height /= ratioHeight;
					}
				}
			}
			
			try {
			if ($.draw.debug > 3 && window.console && console.log) console.log(" > resize dimensions", {
				width: width,
				height: height
			});
			} catch (err) {
			console.log(" > resize dimensions", err);
			$.error(err);
			}
			
			$canvas
				.prop({
					width: width,
					height: height
				})
				.each(function() {
					if ($.draw.debug > 3 && window.console && console.log) console.log(this,".getContext('2d').drawImage(",item,", 0, 0, ",width, ", ", height, ");");
					this.getContext('2d').drawImage(item, 0, 0, width, height);
				});
			
			return canvas;
		},
		
		/**
		 * <p>Asynchronous draw url into a HTMLImageElement.</p>
		 * <p>Since img width and height cannot be correctly assessed outside of the document
		 * it is appended to the body.</p>
		 *
		 * @todo  For some reason the crossOrigin property for HTMLImageElement causes dataURLs to fail.
		 * This needs to be looked into.
		 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Img
		 *
		 * @private
		 * @function $.draw.url2img
		 * @param {URL} url
		 * @param {HTMLImageElement} img
		 * @param {Object.<({crossOrigin:String.<('anonymous'|'use-credentials')>})>=} option
		 * @returns {$.Deferred}
		 */
		url2img: function (url, img, options) {
			if ($.draw.debug > 2 && window.console && console.log) console.log("$.draw.url2img", url, img, options);
			options = options || options;
			var def = new $.Deferred();
			if (!url) def.reject("Empty source");
			
			if (options && options.crossOrigin) img.crossOrigin = options.crossOrigin;
			img.onload = function () {
				def.resolve(img);
			};
			img.onerror = function (e) {
				this.onerror = null;
				if ($.draw.debug > 2 && window.console && console.log) console.warn(e);
				def.reject(e.type);
			};
			img.src = url;
			return def;
		},
		
		/**
		 * <p>Asynchronous draw url into a new HTMLCanvasElement.</p>
		 * <p>Draw url into a new HTMLImageElement.</p>
		 * <p>Since img width and height cannot be correctly assessed outside of the document
		 * it is appended to the body.</p>
		 *
		 * @private
		 * @function $.draw.url2canvas
		 * @param {URL} url
		 * @param {HTMLCanvasElement|jQuery_Set_of_HTMLCanvasElements} canvas
		 * @param {Object} resize Optional resize parameters: width, height, maxWidth, maxHeight, scale
		 * @returns {$.Deferred instance}
		 */
		url2canvas: function (url, canvas, resize) {
			if ($.draw.debug > 2 && window.console && console.log) console.log("$.draw.url2canvas", url, canvas, resize);
			return $.draw.url2img(url, document.createElement("img")).then(function(img){
				img.style.position = "absolute";
				img.style.left = "-99999px";
				img.style.top = "-99999px";
				document.body.appendChild(img);
				try {
					canvas = $.draw.element2canvas(img, canvas, resize);
					img.parentNode.removeChild(img);
					return canvas;
				} catch (err) {
					img.parentNode.removeChild(img);
					var def = new $.Deferred();
					def.reject(err);
					return def;
				}
			});
		},
		
		/**
		 * Asynchronous draw blob into a new HTMLCanvasElement.
		 *
		 * @private
		 * @function $.draw.blob2canvas
		 * @param {Blob|File} blob
		 * @param {HTMLCanvasElement|jQuery-set-of-HTMLCanvasElements} canvas
		 * @param {Object} resize Optional resize parameters: width, height, maxWidth, maxHeight, scale
		 * @returns {$.Deferred instance}
		 */
		blob2canvas: function (blob, canvas, resize) {
			if ($.draw.debug > 2 && window.console && console.log) console.log("$.draw.blob2canvas", blob, canvas, resize);
			if (!/^image\//.test(blob.type)) return new $.Deferred().reject("Cannot draw blob to canvas. Wrong data type: " + blob.type);
			try {
				var url = $.blob.createURL(blob),
					def = (
						$.draw.url2canvas(url, canvas, resize)
						.always(function(){
							$.blob.revokeURL(url);
						})
					);
			} catch(err) {
				var def = new $.Deferred().resolve(err);
			}
			return def;
		}
	});
	
	
	/**
	 * Debug toggler
	 *
	 * @parameter $.blob.debug
	 * @type {Number}
	 * @default 0
	 */
	$.draw.debug = 0;
	
	
	/**
	 * This method wraps around the $.draw method and when executing it puts it into a queue.
	 *
	 * @see $.draw
	 *
	 * @method $.fn.draw
	 * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement|File|Blob} source
	 * @param {Object} options Options: type, width, height, scale, async, quality
	 * @param {Scalar} qType jQuery queue type
	 * @chainable
	 */
	$.fn.draw = function (source, options, qType) {
		if ($.draw.debug && window.console && console.info) console.info("$.fn.draw", source, this, options);
		if (options && options.async) {
			qType = qType || "fx";
			var def = $.draw(source, this, options);
			return this.queue(qType, function () {
				var el = this;
				def.always(function () {
					$.dequeue(el, qType);
				});
			});
		} else {
			return $.draw(source, this, options);
		}
	};
	
	return $;
}));