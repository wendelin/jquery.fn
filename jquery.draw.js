(function($){
	var DEBUG = 4;
	
	/**
	 * Convert number of bytes to human readable format.
	 *
	 * @private
	 * @function _readablizeBytes
	 * @param bytes {Number}
	 * @return {String}
	 */
	var _readablizeBytes = function (bytes) {
		var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
			e = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, e)).toFixed(2) + " " + s[e];
	};
	
	/**
	 * Draw an item onto a HTMLCanvasElement or a set of canvases.
	 * Supports resizing
	 *
	 * Note it returns the canvas it gets.
	 * If the canvas given to it is a "raw" HTMLElement that that is what it returns. If it receives
	 * a jQuery set of one HTMLCanvasElement it returns that.
	 *
	 * @private
	 * @method _elementToCanvas
	 * @param item {HTMLVideo || HTMLCanvasElement || HTMLImageElement}
	 * @param canvas {HTMLCanvasElement || jQuery Set of HTMLCanvasElements}
	 * @param resize {object} Optional resize parameters: width, height, maxWidth, maxHeight, scale
	 * @returns {HTMLCanvasElement || jQuery set of single HTMLCanvasElement}
	 */
	var _elementToCanvas = function (item, canvas, resize) {
		if (DEBUG > 2) console.log("_elementToCanvas", item, canvas, resize);
		
		var $item   = $(item),
			$canvas = $(canvas);
		
		item = $item.get(0);
		
		if (DEBUG > 3) {
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
			/**
			 * For video resizing use actual video dimensions rather then those of the HTMLVideoElement.
			 */
			var isVideoResize = $item.is("video") && (resize.width || resize.height);
			
			/**
			 * throw error if video element is "empty" (width & height == 0)
			 */
			if ($item.is("video") && !$item.prop("videoWidth")&& !$item.prop("videoHeight")) {
				$.error("HTMLVideoElement is empty!");
			}
			
			
			width  = (isVideoResize) ? item.videoWidth  : item.width  || $item.width();
			height = (isVideoResize) ? item.videoHeight : item.height || $item.height();
			
			/**
			 * TODO: Permit percent values for width & height
			if (/^\d+(\.\d+)?%$/.test(resize.width)) {
				resize.width = Math.round(width * (parseFloat(resize.width) / 100));
				if (DEBUG) console.log(" > resize.width", resize.width);
			}
			if (/^\d+(\.\d+)?%$/.test(resize.height)) {
				resize.height = Math.round(height * (parseFloat(resize.height) / 100));
				if (DEBUG) console.log(" > resize.height", resize.height);
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
		if (DEBUG > 3) console.log(" > resize dimensions", {
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
				if (DEBUG > 3) console.log(this,".getContext('2d').drawImage(",item,", 0, 0, ",width, ", ", height, ");");
				this.getContext('2d').drawImage(item, 0, 0, width, height);
			});
		
		return canvas;
	};
	
	/**
	 * Get (data)URL from HTMLCanvasElement.
	 *
	 * @private
	 * @method _canvas2url
	 * @param canvas {HTMLCanvasElement}
	 * @param options {object} Optional resize parameters: type, quality
	 * @returns {}
	 */
	var _canvas2url = function (canvas, options) {
		if (DEBUG > 2) console.log("_canvas2img", canvas, options);
		return (
			(/^image\/(jpeg|webp)$/.test(options.type))
			? canvas.toDataURL(options.type, ((options.quality||1)/1))
			: canvas.toDataURL(options.type)
		);
	};
	
	/**
	 * Draw HTMLCanvasElement to HTMLImageElement.
	 *
	 * @private
	 * @method _canvas2img
	 * @param canvas {HTMLCanvasElement}
	 * @param img {HTMLImageElement || jQuery Set of HTMLCanvasElements}
	 * @param options {object} Optional image parameters: type, quality
	 * @returns {URL}
	 */
	var _canvas2img = function (canvas, img, options) {
		if (DEBUG > 2) console.log("_canvas2img", canvas, img, options);
		$(img).attr("src", _canvas2url(canvas, options));
		return img;
	};
	
	/**
	 * Asynchronous draw url into a HTMLImageElement.
	 * Since img width and height cannot be correctly assessed outside of the document
	 * it is appended to the body.
	 *
	 * @private
	 * @function async_url2img
	 * @param url {URL}
	 * @param img {HTMLImageElement}
	 * @returns {$.Deferred instance}
	 */
	var async_url2img = function (url, img) {
		if (DEBUG > 2) console.log("async_url2img", url, img);
		var def = new $.Deferred();
		img.onload = function () {
			def.resolve(img);
		};
		img.onerror = function (err) {
			this.onerror = null;
			def.reject(err);
		};
		img.src = url;
		return def;
	};
	
	/**
	 * Asynchronous draw url into a new HTMLCanvasElement.
	 * Draw url into a new HTMLImageElement.
	 * Since img width and height cannot be correctly assessed outside of the document
	 * it is appended to the body.
	 *
	 * @private
	 * @function async_url2Canvas
	 * @param url {URL}
	 * @param canvas {HTMLCanvasElement || jQuery Set of HTMLCanvasElements}
 	 * @param resize {object} Optional resize parameters: width, height, maxWidth, maxHeight, scale
	 * @returns {$.Deferred instance}
	 */
	var async_url2Canvas = function (url, canvas, resize) {
		if (DEBUG > 2) console.log("async_url2Canvas", url, canvas, resize);
		return async_url2img(url, document.createElement("img")).then(function(img){
			img.style.position = "absolute";
			img.style.left = "-99999px";
			img.style.top = "-99999px";
			document.body.appendChild(img);
			try {
				canvas = _elementToCanvas(img, canvas, resize);
				img.parentNode.removeChild(img);
				return canvas;
			} catch (err) {
				img.parentNode.removeChild(img);
				var def = new $.Deferred();
				def.reject(err);
				return def;
			}
		});
	};
	
	/**
	 * Asynchronous draw blob into a new HTMLCanvasElement.
	 *
	 * @private
	 * @function async_blob2Canvas
	 * @param blob {Blob || File}
	 * @param canvas {HTMLCanvasElement || jQuery Set of HTMLCanvasElements}
 	 * @param resize {object} Optional resize parameters: width, height, maxWidth, maxHeight, scale
	 * @returns {$.Deferred instance}
	 */
	var async_blob2Canvas = function (blob, canvas, resize) {
		if (DEBUG > 2) console.log("async_blob2Canvas", blob, canvas, resize);
		if (!/^image\//.test(blob.type)) return new $.Deferred().reject("Cannot draw blob to canvas. Wrong data type: " + blob.type);
		try {
			var url = $.blob.createURL(blob),
				def = async_url2Canvas(url, canvas, resize)
					.always(function(){
						$.blob.revokeURL(url);
					});
		} catch(err) {
			var def = new $.Deferred().resolve(err);
		}
		return def;
	};
	
	
	/**
	 * Drawing method takes visual data from a single given source and "draws" it into each element
	 * of the context jQuery element set.
	 *
	 * Supported sources are:
	 * - HTMLVideoElement
	 * - HTMLCanvasElement
	 * - HTMLImageElement
	 * - File, containing imagery data that can be put into a HTMLImageElement
	 * - Blob, "
	 * - URL, any valid URL will do: dataURL, Blob URL, normal URL, whatever
	 *
	 * Supported targets
	 * - HTMLCanvasElement
	 * - HTMLImageElement
	 *
	 * Note:
	 *   If the source is a HTMLVideoElement then a video still image is taken and drawn into 
	 *   the target or each item in the target set.
	 *
	 * If successful the deferred object is resolved with the target.
	 *
	 * options:
	 * - type {String} MimeType to be used when drawing img[s]
	 * - width {Integer} Resize width
	 * - height {Integer} Resize height
	 * - scale {Boolean} Resize scaling/keep aspect ratio when resizing
	 * - async {Boolean} Async mode (enables File and Blob sources) method will return $.Deferred for chaining
	 * - maxWidth {Integer} Max width constraint
	 * - maxHeight {Integer} Max height constraint
	 *
	 * @public
	 * @method $.draw
	 * @param source {URL || HTMLElement || jQuery set || File || Blob}
	 * @param target {HTMLElement || jQuery set} If undefined a new HTMLCanvasElement is used
	 * @param options {Object} Options: type, width, height, scale, async
	 * @returns {Object} target or if async=true $.Deferred instance that when successful returns the target
	 */
	$.draw = function (source, target, options) {
		if (DEBUG) console.info("$.draw", source, target, options);
		options = $.isPlainObject(options) ? options : {width:null, height:null, scale:true, type:options, async: false};
		source = $.dataURL.is(source) ? $.dataURL.toBlob(source) : $(source).get(0);	// Remove jQuery wrapping on source
		
		if (!$(target).is("img,canvas")) {
			$.error("$.draw: Target type not supported: " + target);
		}
		
		if (options.async) {
			source = (
				$(source).is('input[type="file"]')
				? source.files[0]
				: (
					$(source).is('input,select,textarea')
					? $(source).val()
					: source
				)
			);
			
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
					? async_blob2Canvas(source, canvas, options)
					: (
						(typeof(source) === "string")
						? async_url2Canvas(source, canvas, options)
						: _elementToCanvas(source, canvas, options)
					)
				);
			} catch (err) {
				return def.reject(err);
			}
			
			var chain = $.when(source);
			
			if (target) {
				chain = chain.then(function(canvas){
					try {
					_canvas2img(canvas, target, {
						type: options.type,
						quality: options.quality
					});
					} catch (err) {
						def.reject(err);
					}
					return target;
				});
			}
			
			chain.then(def.resolve, def.reject, def.notify);
			
			return def;
		}
		
		/**
		 * Use proxy if target is not a canvas
		 */
		if (!$(source).is("canvas")) {
			source = _elementToCanvas(source, document.createElement("canvas"), options);
		}
		
		_canvas2img(source, target, {
			type: options.type,
			quality: options.quality
		});
		
		return target;
	};
	
	/**
	 * Get a Blob
	 *
	 * Options:
	 * - multiple {Boolean} override, force support for multiple files from single source => see: <input type="file" multiple />
	 * - async {Boolean} Wrap response in a $.Deferred
	 * - type {String} Image mimetype to default to or if (convert) to enforce
	 * - convert {Boolean} Conversion to be forced: image mimeType and width && height
	 * - width {Integer} Resize image width
	 * - height {Integer} Resize image height
	 *
	 * @method $.blob
	 * @param source {File || Blob || HTMLVideoElement || HTMLCanvasElement || HTMLImageElement}
	 * @param options {Object} Options: multiple, convert, async, width, height, type
	 * @return {Blob || File || $.Deferred()}
	 */
	$.blob = function (source, options) {
		if (DEBUG) console.info("$.blob", source, options);
		options = options || {type:null, async:false, multiple: false, convert:false};
		
		var $source = $(source).first(),
			source = $source.get("0"),
			stack;
		
		if (source instanceof Blob) stack = [source];
		else if ($source.is('img[src^="data:"]')) stack = [$.dataURL.toBlob(source.src)]
		else if ($source.is('input[type="file"]')) stack = $.makeArray(source.files);
		else if (!$source.is("canvas")) {
			stack = [$.dataURL.toBlob(
				_canvas2url(
					_elementToCanvas(source, document.createElement("canvas"), options),
					options
				)
			)];
			options.convert = false;	// No conversion needed, all convert possibilities covered here
		}
		else {
			stack = [$.dataURL.toBlob(
				_canvas2url(source, options.type, options.quality)
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
		 * File/Blob URL.
		 * This method makes it possible to get a direct reference to a Blob/File.
		 * No conversion to dataURL is needed. This should translate into better
		 * performance (less memory & time).
		 *
		 * @method $.blob.createURL
		 * @param blob {File || Blob}
		 * @return {String}
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
		 * @param blob {File || Blob}
		 * @return {String}
		 */
		revokeURL: function (url) {
			return (window.URL || window.webkitURL).revokeObjectURL(url);
		},
		
		/**
		 * File/Blob size.
		 * Getting the size of a blob in bytes is best done directly (blob.size).
		 * This method has the advantage that it can convert the bytes value into
		 * a human readable format.
		 *
		 * @method $.blob.size
		 * @param blob {File || Blob}
		 * @param humanReadable {Boolean}
		 * @return {String}
		 */
		size: function (blob, humanReadable) {
			return (humanReadable ? _readablizeBytes(blob.size) : blob.size);
		},
		
		/**
		 * Blob/File converter that supports changing of type & dimensions.
		 *
		 * Options:
		 *  See: async_blob2Canvas
		 *
		 * @method $.blob.convert
		 * @param blob {File || Blob}
		 * @param options {Object} Options: async, width, height, scale, type
		 * @return {File || Blob || $.Deferred}
		 */
		convert: function (blob, options) {
			if (DEBUG > 1) console.log("$.blob.convert", blob, options);
			options = options || {};
			if (!options.async) $.error("$.blob.convert: Cannot convert blob synchronously.");
			
			var def = $.Deferred(),
				stack = async_blob2Canvas(blob, document.createElement("canvas"), options);
			
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
				} catch (err) {console.warn(err);}
				
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
		 * Example:
		 *   $.blob.save(new Blob(["Hello World!"]), "hello.txt");
		 *
		 * See:
		 *   http://stackoverflow.com/questions/18925210/download-blob-content-using-specified-charset
		 *   http://msdn.microsoft.com/en-us/library/ie/hh779016%28v=vs.85%29.aspx
		 *   http://hackworthy.blogspot.com/2012/05/savedownload-data-generated-in.html
		 *
		 * @method $.blob.save
		 * @param {File || Blob}
		 * @param name {String}
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
				if (DEBUG) console.info("$.save", blob, name);
				return fn(blob, name || blob.name || blob.type.replace("/","."));
			})
		}()),
		
		/**
		 * Type test, supports general type testing ("image","audio","video",...) and
		 * specific type testing ("application/zip", "image/png", "image/jpeg",...).
		 *
		 * Usage:
		 * - $.blob.is(blob);
		 * - $.blob.is(blob, "image");
		 * - $.blob.is(blob, "image/png");
		 *
		 * @method $.blob.is
		 * @param blob {Blob || File} Valid blob or file
		 * @param str {String} Test string
		 * @returns {Boolean}
		 */
		is: function (blob, str) {
			return (
				blob
				&& blob instanceof Blob
				&& (
					(str.indexOf("/") === -1)
					? (new RegExp("^" + str + "\/")).test(blob.type)
					: str === blob.type
				)
			);
		}
	});
	
	/**
	 * Wrapped FileReader methods
	 * See: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
	 * 
	 * @method $.blob.readAsArrayBuffer
	 * @param blob {File || Blob}
	 * @return {$.Deferred}
	 *
	 * @method $.blob.readAsBinaryString
	 * @param blob {File || Blob}
	 * @return {$.Deferred}
	 *
	 * @method $.blob.readAsDataURL
	 * @param blob {File || Blob}
	 * @return {$.Deferred}
	 *
	 * @method $.blob.readAsText
	 * @param blob {File || Blob}
	 * @return {$.Deferred}
	 */
	$.each(["readAsArrayBuffer","readAsBinaryString","readAsDataURL","readAsText"], function(i, method){
		$.blob[method] = function(blob, options){
			if (DEBUG > 1) console.log("$.blob." + method, blob, options);
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
	 * Get dataURL[s]
	 *
	 * Options:
	 * - multiple {Boolean} override, force support for multiple files from single source => see: <input type="file" multiple />
	 * - async {Boolean} Wrap response in a $.Deferred
	 * - type {String} Image mimetype to default to or if (convert) to enforce
	 * - convert {Boolean} Conversion to be forced: image mimeType and width && height
	 * - width {Integer} Resize image width
	 * - height {Integer} Resize image height
	 *
	 * @method $.dataURL
	 * @param source {File || Blob || HTMLVideoElement || HTMLCanvasElement || HTMLImageElement}
	 * @param options {Object} Options: multiple, convert, async, width, height, type
	 * @return {URL || $.Deferred()}
	 */
	$.dataURL = function (source, options) {
		if (DEBUG) console.info("$.dataURL", source, options);
		options = options || {type:null, async:false, multiple: false, convert:false};
		
		var $source = $(source).first(),
			source = $source.get("0"),
			stack;
		
		if ($source.is('img[src^="data:"]')) stack = [source.src];
		else if ($source.is("img,canvas,video")) {
			stack = [
				_canvas2url(
					_elementToCanvas(source, document.createElement("canvas"), options),
					options.type, options.quality
				)
			];
			options.convert = false;	// No conversion needed, all convert possibilities covered here
		}
		else if ($source.is("canvas")) stack = [$.dataURL.toBlob(
			_canvas2url(source, options.type, options.quality)
		)];
		
		if (options.async) {
			if (source instanceof Blob) {
				stack = [source];
				stack = $.map(stack, function(blob){
					return (
						options.convert
						? async_blob2Canvas(blob, document.createElement("canvas"), options)
						.then(function(canvas){
							return _canvas2url(canvas, options)
						})
						: $.blob.readAsDataURL(blob,{async:options.async})
					);
				});
			} else if ($source.is('input[type="file"]')) {
				stack = $.makeArray(source.files);
				if (!options.multiple) stack = stack.slice(0,1);
				stack = $.map(stack, function(blob){
					return (
						options.convert
						? async_blob2Canvas(blob, document.createElement("canvas"), options)
						.then(function(canvas){
							return _canvas2url(canvas, options)
						})
						: $.blob.readAsDataURL(blob,{async:options.async})
					);
				});
			
			} else if (options.convert) {
				stack = [async_url2Canvas(stack[0], document.createElement("canvas"), options)
				.then(function(canvas){
					return _canvas2url(canvas, options)
				})];
			}
			
			return $.when.apply($.when, stack);
			
		} else if (options.convert) {
			$.error("$.blob: forced conversion of source (" + source + ") cannot be done synchronously");
		}
		
		return options.multiple ? stack : stack[0];
	};
	$.extend($.dataURL, {
		/**
		 * Attempt to get the mimeType of a given dataURL.
		 *
		 * @method $.dataURL.type
		 * @param url {String}
		 * @return {String}
		 */
		type: function (url) {
			return url.split(',')[0].split(':')[1].split(';')[0];
		},
		
		/**
		 * Raw dataURL size (same as the length)
		 *
		 * @method $.dataURL.rawSize
		 * @param url {String}
		 * @param humanReadable {Boolean}
		 * @return {String}
		 */
		rawSize: function (url, humanReadable) {
			var bytes = url.length;
			return (humanReadable ? _readablizeBytes(bytes) : bytes);
		},
		
		/**
		 * Size of the dataURL's file.
		 * (It removes the type info and accounts for the bloat.)
		 *
		 * @method $.dataURL.size
		 * @param url {String}
		 * @param humanReadable {Boolean}
		 * @return {String}
		 */
		size: function (url, humanReadable) {
			var bytes = Math.round(url.split(',')[1].length*3/4);
			return (humanReadable ? _readablizeBytes(bytes) : bytes);
		},
		
		/**
		 * Convert a dataURL to a Blob object
		 * See: https://developer.mozilla.org/en-US/docs/Web/API/Blob
		 *
		 * @public
		 * @method $.dataURL.toBlob
		 * @param url {String} Valid dataURL
		 * @returns {Blob}
		 */
		toBlob: function (url) {
			var mime = url.split(',')[0].split(':')[1].split(';')[0],
				binary = atob(url.split(',')[1]), array = [];
			for(var i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
			return new Blob([new Uint8Array(array)], {type: mime});
		},
		
		/**
		 * Force the browser to try to save a given dataURL.
		 * Support for normal URLs is also added.
		 *
		 * @method $.dataURL.save
		 * @param url {String} Valid dataURL || URL
		 * @param name {String}
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
		 * Usage:
		 * - $.dataURL.is(url);
		 * - $.dataURL.is(url, "image");
		 * - $.dataURL.is(url, "image/png");
		 *
		 * @method $.dataURL.is
		 * @param url {String} Valid dataURL
		 * @param str {String} Test string
		 * @returns {Boolean}
		 */
		is: function (url, str) {
			if (!(url && typeof(url) === "string" && /^data:/.test(url))) return false;
			var type = $.dataURL.type(url);
			return (
				(str && str.indexOf("/") === -1)
				? (new RegExp("^" + str + "\/")).test(type)
				: str === type
			);
		}
	});
	
	/**
	 * TODO: $.save
	 *   allow for all kinds of input:
	 *   - Blob, {name:"some file"}
	 *   - File, {name:"override name}
	 *   - dataURL, {name:"some file"}
	 *   - <img>, ¿{name:"override name"}?		// Can autodetect name?
	 *   - <canvas>, {name:"some file"}
	 *   - <video>, {name:"some file"}
	 */
	
	$.fn.extend({
		/**
		 * This method wraps around the $.draw method and when executing it puts it into a queue
		 * queue.
		 *
		 * See: $.draw
		 *
		 * @method: $.fn.draw
		 * @param source {HTMLElement || File || Blob} Source element: <video> or <canvas>
		 * @param options {Object} Options: type, width, height, scale, async, quality
		 * @param qType {Scalar} jQuery queue type
		 * @chainable
		 */
		draw: function (source, options, qType) {
			if (DEBUG) console.info("$.fn.draw", source, this, options);
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
		},
		
		/**
		 * Get a single Blob or array of Blob[s].
		 *
		 * Options:
		 * - multiple {Boolean} Return array of Blob[s]
		 * - async {Boolean} Async mode (enables File and Blob sources) method will return $.Deferred for chaining
		 * - type {String} MimeType to be used when drawing img[s]
		 * - convert {Boolean} Conversion to be forced: image type and width && height
		 * - width {Integer} Resize width
		 * - height {Integer} Resize height
		 * - scale {Boolean} Resize scaling/keep aspect ratio when resizing
		 * - quality {Integer} Image quality
		 *
		 * Usage:
		 * - Get array of File[s] for all upload fields:
		 *   $('input[type="file"]').blob({multiple:true});
		 *
		 * - Get array of Blob[s] forcibly converted from all upload fields (only works with images)
		 *   $("input[type="file"][multiple]")
		 *    .blob({convert:true, async:true, multiple:true, width:40, scale:true})
		 *    .then(console.info,console.warn);
		 *
		 * Examples:
		 * - $("img").blob({multiple:true});
		 * - $('input[type="file"]')
		 *   .blob({convert:true,async:true,type:"image/jpeg",width:100,scale:true})
		 *   .then(console.info,console.warn);
		 *
		 * @method Blob
		 * @param options {Object} Options: multiple, async, type, convert, width, height, scale
		 * @return {Blob | File |  $.Deferred}
		 */
		blob: function (options) {
			if (DEBUG) console.info("$.fn.blob", this, options);
			if (options && options.multiple) {
				var arr = [];
				this.each(function(){
					arr.push($.blob(this, options));
				});
			
				/**
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
		},
		
		/**
		 * Get a single dataURL or array of dataURL[s].
		 *
		 * Options:
		 * - multiple {Boolean} Return array of Blob[s]
		 * - async {Boolean} Async mode (enables File and Blob sources) method will return $.Deferred for chaining
		 * - type {String} MimeType to be used when drawing img[s]
		 * - convert {Boolean} Conversion to be forced: image mimeType and width && height
		 * - width {Integer} Resize width
		 * - height {Integer} Resize height
		 * - scale {Boolean} Resize scaling/keep aspect ratio when resizing
		 *
		 * Usage:
		 * - Get array of File[s] for all upload fields:
		 *   $('input[type="file"]').blob({multiple:true});
		 * - Get array of Blob[s]
		 *
		 * @method dataURL
		 * @param options {Object} Options: multiple, async, type, convert, width, height, scale
		 * @return {Object} $.Deferred instance
		 */
		dataURL: function (options) {
			if (DEBUG) console.info("dataURL", this, options);
			if (options && options.multiple) {
				var arr = [];
				this.each(function(){
					arr.push($.dataURL(this, options));
				});
			
				/**
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
		},
		
		/**
		 * Get a single Blob or array of Blob[s].
		 *
		 * Options:
		 * - multiple {Boolean} Return array of Blob[s]
		 * - async {Boolean} Async mode (enables File and Blob sources) method will return $.Deferred for chaining
		 * - type {String} MimeType to be used when drawing img[s]
		 * - convert {Boolean} Conversion to be forced: image mimeType and width && height
		 * - width {Integer} Resize width
		 * - height {Integer} Resize height
		 * - scale {Boolean} Resize scaling/keep aspect ratio when resizing
		 *
		 * Usage:
		 * - Get array of File[s] for all upload fields:
		 *   $('input[type="file"]').blob({multiple:true});
		 * - Get array of Blob[s]
		 *
		 * @method $.fn.save
		 * @param options {Object} Options: multiple, async, type, convert, width, height, scale
		 * @param qType {Scalar} jQuery queue type
		 * @return {Object} $.Deferred instance
		 */
		save: function (options, qType) {
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
		}
	});
}(jQuery));