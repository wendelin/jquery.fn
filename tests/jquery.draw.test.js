require(["jquery.draw"], function ($) {
	module("jquery.draw");
	
	// $.draw.debug = 10;
	
	var tURL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
		tURL2 = "data:image/gif;base64,R0lGODlhUABQALMAAAAAABQUrgUFLxcXzQQEIBkZ3QICEBYWvg4OfgsLXwkJTwcHPxAQjhISng0Nbxsb7SH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5MUE5MDNDQzVGNjgxMUUwOUJGRENGNEY3OENEQUVCOCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo5MUE5MDNDRDVGNjgxMUUwOUJGRENGNEY3OENEQUVCOCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjYwNkEzRkFGNUY2ODExRTA5QkZEQ0Y0Rjc4Q0RBRUI4IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjYwNkEzRkIwNUY2ODExRTA5QkZEQ0Y0Rjc4Q0RBRUI4Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEAAAAAAAsAAAAAFAAUAAABPLwyUmrvTjrzbv/YCiOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8ikcslsOp/QqHRKrVqv2KxW2DAACIHHYAEQHC7db3ggACwKwgEgnDA8FoqCQmCR0+0CeQIJQgcAZwgGfg+GYwRiAAiHD4mLiUMJX3MBABMADAUGCHgPmQSbnQ8MqUECCwgECZyeYasGcK6wsqmrQpxwDQCLnAMPnAQFvw/BcoiPQXKgCY+BenyhsArRBdMP1QIOQw2nZmJtAsUCfIYM42VnbAAKW/T19vf4+fr7/P3+/wADChxIsKDBgwgTKlzIsKHDhxAjShwYAQA7",
		tBlob = new Blob(["Hello World!"]);
	
	
	/**
	 * $.draw
	 */
	asyncTest("$.draw (simple)", function() {
		var i = 0;
		
		expect(++i);
		throws(function() {
			$.draw(null,document.createElement("canvas"));
		}, null, "null ! => <canvas/>");
		
		expect(++i);
		throws(function() {
			$.draw("string",document.createElement("canvas"));
		}, null, "'string' ! => <canvas/>");
		
		expect(++i);
		throws(function() {
			$.draw(tURL,document.createElement("canvas"));
		}, null, "dataURL ! => <canvas/>");
		
		expect(++i);
		$.draw(tURL, document.createElement("img"), {async:true})
		.always(function(){expect(++i);})
		.then(
			function(img){
				ok($(img).is("img"), "async: dataURL => <img/>: " + img);
				return $.draw(img, document.createElement("canvas"), {async:true});
			},
			function(err){ ok(false, "async: dataURL => <img/>: " + err); }
		)
		.always(function(){expect(++i);})
		.then(
			function(canvas){
				ok($(canvas).is("canvas"), "async: <img/> => <canvas/>: " + canvas);
				return $.draw(canvas, document.createElement("canvas"), {async:true});
			},
			function(err) { ok(false, "async: <img> => <canvas/>: " + err);}
		)
		.always(function(){expect(++i);})
		.then(
			function(canvas){
				ok($(canvas).is("canvas"), "async: <canvas/> => <canvas/>: " + canvas);
				return $.draw(canvas, document.createElement("img"), {async:true});
			},
			function(err) { ok(false, "async: <canvas> => <canvas/>: " + err);}
		)
		.always(function(){expect(++i);})
		.then(
			function(img){
				ok($(img).is("img"), "async: <canvas/> => <img/>: " + img);
				return $.draw($(img), $("<img/>"), {async:true});
			},
			function(err) { ok(false, "async: <canvas> => <img/>: " + err);}
		)
		.always(function(){expect(++i);})
		.then(
			function($img){
				ok( ($img instanceof $ && $img.is("img")), "async: $('<img/>') => $('<img/>'): " + $img);
				return $.draw($img, $("<img/><canvas/>"), {async:true});
			},
			function(err) { ok(false, "async: $('<img/>') => $('<img/>'): " + err);}
		)
		.then(
			function($target){
				ok( $target instanceof $  , "async: $('<img/>') => $('<img/><canvas/>'): " + $target);
			},
			function(err) { ok(false, "async: $('<img/>') => $('<img/><canvas/>'): " + err);}
		)
		.always(function(){start();});
	});
	
	asyncTest("$.draw (complex)", function() {
		var i = 0;
		
		expect(++i);
		$.draw(tURL2, document.createElement("canvas"), {width:10,height:10,async:true})
		.then(
			function(canvas){
				var _k = $(canvas).is("canvas")
				ok(_k, "async: dataURL =[resize:10x10]=> <canvas/>: " + canvas + (_k ? (" " + canvas.width + "x" + canvas.height) : ""));
			},
			function(err){ ok(false, "async: dataURL => <canvas/>: " + err); }
		)
		.always(function(){start();});
		
	});

	
	/**
	 * $.draw.element2canvas
	 */
	asyncTest("$.draw.element2canvas", function() {
		var i = 0;
		
		expect(++i);
		throws(function() {
			$.draw.element2canvas(null,document.createElement("canvas"));
		}, null, "null ! => <canvas/>");
		
		expect(++i);
		throws(function() {
			$.draw.element2canvas("string",document.createElement("canvas"));
		}, null, "'string' ! => <canvas/>");
		
		expect(++i);
		var type;
		$("<img/>").prop("src", tURL).on("load", function(){
			try {
				var img = this,
					canvas = document.createElement("canvas");
				$.draw.element2canvas(img,canvas);
				ok( canvas , "<img/> => <canvas/>" );
				
				var canvas2 = document.createElement("canvas");
				
				expect(++i);
				try {
					$.draw.element2canvas(canvas,canvas2);
					ok( canvas2 , "<canvas/> => <canvas/>");
				
				} catch (err) {
					ok( false , err );
				}
				
			} catch (err) {
				console.warn(err);
				ok( false , err );
			}
			start();
		});
	});
	
	
	/**
	 * $.draw.url2img
	 */
	asyncTest("$.draw.url2img", function() {
		expect(1);
		var img = document.createElement("img"), def;
		
		// $("body").append(img);
		def = $.draw.url2img(tURL, img);
		def.then(
			function(img) {ok(img, "async: dataURL => <img/>: " + img);},
			function(err) {ok(false, "async: dataURL => <img/>: " + err);}
		);
		def.always(function(){start();});
	});
	
	
	/**
	 * $.draw.url2canvas
	 */
	asyncTest("$.draw.url2canvas", function() {
		expect(1);
		var canvas = document.createElement("canvas"), def;
		
		// $("body").append(img);
		def = $.draw.url2canvas(tURL, canvas);
		def.then(
			function(canvas) {ok(canvas , "async: dataURL => <canvas/>: " + canvas);},
			function(err) {ok(false , "async: dataURL => <canvas/>: " + err);}
		);
		def.always(function(){start();});
	});
	
	
	/**
	 * $.draw.blob2canvas
	 */
	asyncTest("$.draw.blob2canvas", function() {
		expect(2);
		var canvas = document.createElement("canvas");
		
		// $("body").append(img);
		$.draw.blob2canvas(tBlob, canvas)
		.then(
			function(arg) {
				ok(false, arg);
			},
			function(err) {
				ok(true, err);
			}
		)
		.always(function(){
			
			try {
				var blob = $.dataURL.toBlob(tURL);
			} catch (err) {
				ok(false, "async: Blob => <canvas/>: " + err);
				start();
				return;
			}
			
			$.draw.blob2canvas(blob, canvas)
			.then(
				function(canvas) {ok(true , "async: Blob => <canvas/>: " + canvas);},
				function(err) {ok(false, "async: Blob => <canvas/>: " + err);}
			)
			.always(function(){
				start();
			});
		});
	});
	
	
	/**
	 * $.fn.draw
	 */
	asyncTest("$.fn.draw", function() {
		expect(1);
		var type;
		$("<img/>").prop("src", tURL).on("load", function(){
			var img = this,
				canvas = document.createElement("canvas");
			
			try {
				var $canvas = $(canvas).draw(img);
				ok($canvas instanceof $, "<img/> => <canvas/>: " + $canvas);
			} catch (err) {
				ok(false, "<img/> => <canvas/>: " + err);
			}
			
			start();
		});
	});
});