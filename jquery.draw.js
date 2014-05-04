(function($){
	var DEBUG = 3;
	
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
	 * Draw an item onto a HTMLCanvasElement or a set of canvases.<br/>
	 * <strong>Supports resizing</strong>
	 *
	 * <p>Note it returns the canvas it gets.<br/>
	 * If the canvas given to it is a "raw" HTMLElement that that is what it returns. If it receives
	 * a jQuery set of one HTMLCanvasElement it returns that.</p>
	 *
	 * @private
	 * @method _elementToCanvas
	 * @param {HTMLVideo|HTMLCanvasElement|HTMLImageElement} item
	 * @param {HTMLCanvasElement || jQuery Set of HTMLCanvasElements} canvas
	 * @param {Object} resize Optional resize parameters: width, height, maxWidth, maxHeight, scale
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
	 * @param {HTMLCanvasElement} canvas
	 * @param {Object} options Optional resize parameters: type, quality
	 * @returns {}
	 */
	var _canvas2url = function (canvas, options) {
		if (DEBUG > 2) console.log("_canvas2url", canvas, options);
		return (
			(/^image\/(jpeg|webp)$/.test(options.type))
			? canvas.toDataURL(options.type, ((options.quality||1)/1))
			: canvas.toDataURL(options.type)
		);
	};
	
	/**
	 * <p>Asynchronous draw url into a HTMLImageElement.</p>
	 * <p>Since img width and height cannot be correctly assessed outside of the document
	 * it is appended to the body.</p>
	 *
	 * @private
	 * @function async_url2img
	 * @param {URL} url
	 * @param {HTMLImageElement} img
	 * @returns {$.Deferred instance}
	 */
	var async_url2img = function (url, img) {
		if (DEBUG > 2) console.log("async_url2img", url, img);
		var def = new $.Deferred();
		if (!url) def.reject("Empty source");
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
	 * <p>Asynchronous draw url into a new HTMLCanvasElement.</p>
	 * <p>Draw url into a new HTMLImageElement.</p>
	 * <p>Since img width and height cannot be correctly assessed outside of the document
	 * it is appended to the body.</p>
	 *
	 * @private
	 * @function async_url2Canvas
	 * @param {URL} url
	 * @param {HTMLCanvasElement|jQuery_Set_of_HTMLCanvasElements} canvas
 	 * @param {Object} resize Optional resize parameters: width, height, maxWidth, maxHeight, scale
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
	 * @param {Blob|File} blob
	 * @param {HTMLCanvasElement|jQuery-set-of-HTMLCanvasElements} canvas
 	 * @param {Object} resize Optional resize parameters: width, height, maxWidth, maxHeight, scale
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
	 * @param {Object.<{type:Scalar,width:Integer,height:Integer,scale:Boolean,async:Boolean,maxWidth:Integer,maxHeight:Integer}>} options Options: type, width, height, scale, async
	 * @returns {Object} target or if async=true $.Deferred instance that when successful returns the target
	 */
	$.draw = function (source, target, options) {
		if (DEBUG) console.info("$.draw", source, target, options);
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
			
			if (target) {
				$.when(source).then(function(canvas){
					try {
						var url = _canvas2url(canvas, options);
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
						console.warn(err);
						console.warn(err + "");
						def.reject(err);
						return;
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
								d.reject(err);
								debug.state = err;
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
				source = _elementToCanvas(source, document.createElement("canvas"), options);
			} catch (err) {
				$.error(err + "\r" + '=> Try async mode if you want to use as source: Blob|File|input[type="file"]');
			}
		}
		
		$(target).attr("src",_canvas2url(canvas, {
			type: options.type,
			quality: options.quality
		}));
		
		return target;
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
	 * @returns {Blob|File|$.Deferred()}
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
		 * File/Blob size.
		 * Getting the size of a blob in bytes is best done directly (blob.size).
		 * This method has the advantage that it can convert the bytes value into
		 * a human readable format.
		 *
		 * @method $.blob.size
		 * @param {File|Blob} blob
		 * @param {Boolean} humanReadable
		 * @returns {String}
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
		 * @param {File|Blob} blob
		 * @param {Object} options Options: async, width, height, scale, type
		 * @returns {File|Blob|$.Deferred}
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
				if (DEBUG) console.info("$.save", blob, name);
				return fn(blob, name || blob.name || blob.type.replace("/","."));
			})
		}()),
		
		/**
		 * Type test, supports general type testing ("image","audio","video",...) and
		 * specific type testing ("application/zip", "image/png", "image/jpeg",...).
		 *
		 * @example $.blob.is(blob);
		 * @example $.blob.is(blob, "image");
		 * @example $.blob.is(blob, "image/png");
		 *
		 * @method $.blob.is
		 * @param {Blob|File} blob Valid blob or file
		 * @param {String} str Test string
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
	
	/*
	 * Wrapped FileReader methods
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/FileReader
	 */
	
	/**
	 * @method $.blob.readAsArrayBuffer
	 * @param {File|Blob} blob
	 * @param {Object} options
	 * @returns {$.Deferred}
	 */
	
	/**
	 * @method $.blob.readAsBinaryString
	 * @param {File|Blob} blob
	 * @param {Object} options
	 * @returns {$.Deferred}
	 */
	
	/**
	 * @method $.blob.readAsDataURL
	 * @param {File|Blob} blob
	 * @param {Object} options
	 * @returns {$.Deferred}
	 */
	
	/**
	 * @method $.blob.readAsText
	 * @param {File|Blob} blob
	 * @param {Object} options
	 * @returns {$.Deferred}
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
	 * @param {Object} options Options: multiple, convert, async, width, height, type
	 * @returns {URL || $.Deferred()}
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
		 * @param {Boolean} humanReadable
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
		 * @param {Boolean} humanReadable
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
		 * @method $.dataURL.save
		 * @param {String} url Valid dataURL || URL
		 * @param {String} name
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
		 * @example $.dataURL.is(url);
		 * @example $.dataURL.is(url, "image");
		 * @example $.dataURL.is(url, "image/png");
		 *
		 * @method $.dataURL.is
		 * @param {String} url Valid dataURL
		 * @param {String} str Test string
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
	 * @param {Object} options Options: convert, async, width, height, type, name
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
	
	$.fn.extend({
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
		 * @example $('input[type="file"]').blob({multiple:true});
		 *   Get array of File[s] for all upload fields:
		 * @example Get array of Blob[s] forcibly converted from all upload fields (only works with images)
		 *   $("input[type="file"][multiple]")
		 *    .blob({convert:true, async:true, multiple:true, width:40, scale:true})
		 *    .then(console.info,console.warn);
		 * @example $("img").blob({multiple:true});
		 * @example $('input[type="file"]')
		 *   .blob({convert:true,async:true,type:"image/jpeg",width:100,scale:true})
		 *   .then(console.info,console.warn);
		 * @method $.fn.blob
		 * @param {Object} options Options: multiple, async, type, convert, width, height, scale
		 * @returns {Blob|File|$.Deferred}
		 */
		blob: function (options) {
			if (DEBUG) console.info("$.fn.blob", this, options);
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
		},
		
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
		dataURL: function (options) {
			if (DEBUG) console.info("dataURL", this, options);
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
		},
		
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
		 * @example Get array of File[s] for all upload fields:
		 *   $('input[type="file"]').blob({multiple:true});
		 *
		 * @method $.fn.save
		 * @param {Object} options Options: multiple, async, type, convert, width, height, scale
		 * @param {Scalar} qType jQuery queue type
		 * @returns {Object} $.Deferred instance
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