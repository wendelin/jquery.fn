require(["jquery.dataURL"], function ($) {
	module("jquery.dataURL");
	
	var tURL1 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
		tURL2 = "data:image/gif;base64,R0lGODlhUABQALMAAAAAABQUrgUFLxcXzQQEIBkZ3QICEBYWvg4OfgsLXwkJTwcHPxAQjhISng0Nbxsb7SH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5MUE5MDNDQzVGNjgxMUUwOUJGRENGNEY3OENEQUVCOCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo5MUE5MDNDRDVGNjgxMUUwOUJGRENGNEY3OENEQUVCOCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjYwNkEzRkFGNUY2ODExRTA5QkZEQ0Y0Rjc4Q0RBRUI4IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjYwNkEzRkIwNUY2ODExRTA5QkZEQ0Y0Rjc4Q0RBRUI4Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEAAAAAAAsAAAAAFAAUAAABPLwyUmrvTjrzbv/YCiOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8ikcslsOp/QqHRKrVqv2KxW2DAACIHHYAEQHC7db3ggACwKwgEgnDA8FoqCQmCR0+0CeQIJQgcAZwgGfg+GYwRiAAiHD4mLiUMJX3MBABMADAUGCHgPmQSbnQ8MqUECCwgECZyeYasGcK6wsqmrQpxwDQCLnAMPnAQFvw/BcoiPQXKgCY+BenyhsArRBdMP1QIOQw2nZmJtAsUCfIYM42VnbAAKW/T19vf4+fr7/P3+/wADChxIsKDBgwgTKlzIsKHDhxAjShwYAQA7";
	
	/**
	 * $.dataURL
	 */
	asyncTest("$.dataURL", function() {
		var i = 0
		expect(++i);
		$.dataURL(tURL1, {async:true})
		.then(
			function(url){
				ok(url === tURL1, "dataURL =[unchanged]=> dataURL");
			},
			function(err){
				ok(false, "dataURL =[unchanged]=> dataURL: " + err);
			}
		)
		
		.then(function(){
			expect(++i);
			return (
				$.dataURL([tURL1,tURL2], {async:true})
				.then(
					function(url1, url2){
						ok(url1 === tURL1 && !url2, "[dataURL,dataURL] =[unchanged]=> dataURL");
					},
					function(err){
						ok(false, "[dataURL,dataURL] =[unchanged]=> dataURL: " + err);
					}
				)
			);
		})
		
		.then(function(){
			expect(++i);
			return (
				$.dataURL([tURL1, tURL2], {async:true, multiple:true})
				.then(
					function(url1, url2){
						ok(url1 === tURL1 && url2 === tURL2, "[dataURL,dataURL] =[unchanged]=> [dataURL,dataURL]");
					},
					function(err){
						ok(false, "[dataURL,dataURL] =[unchanged]=> [dataURL,dataURL]: " + err);
					}
				)
			);
		})
		
		.then(function(){
			expect(++i);
			return (
				$.dataURL([tURL1, tURL2], {async:true, multiple:true, convert:true, type:"image/png"})
				.then(
					function(url1, url2){
						ok((
							url1 !== tURL1
							&& url2 !== tURL2
							&& url1.indexOf("data:image/png;") === 0
							&& url2.indexOf("data:image/png;") === 0
						), "[dataURL,dataURL] =[changedType]=> [dataURL,dataURL]");
					},
					function(err){
						ok(false, "[dataURL,dataURL] =[unchanged]=> [dataURL,dataURL]: " + err);
					}
				)
			);
		})
		
		.then(function(){
			expect(++i);
			return (
				$.dataURL(tURL2, {async:true, multiple:false, convert:true, type:"image/png", width:1, height:1})
				.then(
					function(url){
						ok((
							url !== tURL1
							&& url.indexOf("data:image/png;") === 0
						), "dataURL =[converted]=> dataURL");
					},
					function(err){
						ok(false, "[dataURL,dataURL] =[unchanged]=> [dataURL,dataURL]: " + err);
					}
				)
			);
		})
		
		.always(function(){start();});
	});
	
	
	
	/**
	 * $.dataURL.fromCanvas
	 */
	asyncTest("$.dataURL.fromCanvas", function() {
		expect(1);
		var type;
		$("<img/>").prop("src", tURL1).on("load", function(){
			var canvas = document.createElement("canvas");
			
			try {
				var $canvas = $(canvas).draw(this);
				
				try {
					var url = $.dataURL.fromCanvas($canvas);
					ok(url, url);
				} catch (err) {
					console.warn("err 2");
					console.warn(err);
					ok(false, err);
				}
				
			} catch (err) {
				console.warn("err 1");
				console.warn(err);
				ok(false, err);
			}
			
			start();
		});
	});
	
	
	/**
	 * $.dataURL.type
	 */
	test("$.dataURL.type", function() {
		var type;
		type = $.dataURL.type(tURL1);
		ok( type === "image/gif" , type );
	});
	
	
	/**
	 * $.dataURL.rawSize
	 */
	test("$.dataURL.rawSize", function() {
		var size;
		size = $.dataURL.rawSize(tURL1);
		ok(size === 78, size);
		size = $.dataURL.rawSize(tURL1, true);
		ok(size === "78.00 bytes", size);
	});
	
	
	/**
	 * $.dataURL.size
	 */
	test("$.dataURL.size", function() {
		var size;
		size = $.dataURL.size(tURL1);
		ok(size === 42, size );
		size = $.dataURL.size(tURL1, true);
		ok(size === "42.00 bytes", size);
	});
	
	
	/**
	 * $.dataURL.toBlob
	 */
	test("$.dataURL.toBlob", function() {
		var blob = $.dataURL.toBlob(tURL1);
		ok(blob instanceof Blob, "dataURL to Blob");
	});
	
	
	/**
	 * $.dataURL.save
	 */
	
	
	/**
	 * $.dataURL.is
	 */
	test("$.dataURL.is", function() {
		ok( $.dataURL.is(null) === false, "null is not a dataURL" );
		ok( $.dataURL.is("wrong", "image") === false, "'wrong' is not a dataURL" );
		ok( $.dataURL.is(tURL1) === true, "dataURL is a dataURL (what a surprise)" );
		ok( $.dataURL.is(tURL1, "image") === true, "dataURL is 'image'" );
		ok( $.dataURL.is(tURL2, "image") === true, "dataURL is 'image'" );
		ok( $.dataURL.is(tURL1, "image/gif") === true, "dataURL is 'image/gif'" );
		ok( $.dataURL.is(tURL2, "image/gif") === true, "dataURL is 'image/gif'" );
		ok( $.dataURL.is(tURL1, "image/png") !== true, "dataURL != 'image/png'" );
		ok( $.dataURL.is(tURL2, "image/png") !== true, "dataURL != 'image/png'" );
	});
	
	
	/**
	 * $.fn.dataURL
	 */
	asyncTest("$.fn.dataURL", function() {
		var i = 0;
		expect(++i);
		
		var def = new $.Deferred();
		
		$("<img/>").prop("src", tURL1).on("load", function(){
			try {
				var url = $(this).dataURL();
				ok( url , '$("img").dataURL => dataURL');
			} catch (err) {
				ok( false , err );
			}
			def.resolve();
		});
		
		/*
		def.then(function(){
			expect(++i);
			return (
				$('input[type="file"]:first').dataURL({async:true})
				.then(
					function(url){
						ok(true, '$("input[type="file"]:first") => dataURL');
					},
					function(err){
						ok(false, err);
					}
				)
			);
		})
		*/
		def
		.always(function(){start();});
		
	/*
		
	*/
		
		
	});
});