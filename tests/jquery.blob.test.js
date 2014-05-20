require(["jquery.blob"], function ($) {
	module("jquery.blob");
	var tURL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
		tURL2 = "data:image/gif;base64,R0lGODlhUABQALMAAAAAABQUrgUFLxcXzQQEIBkZ3QICEBYWvg4OfgsLXwkJTwcHPxAQjhISng0Nbxsb7SH/C1hNUCBEYXRhWE1QPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4wLWMwNjAgNjEuMTM0Nzc3LCAyMDEwLzAyLzEyLTE3OjMyOjAwICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IE1hY2ludG9zaCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5MUE5MDNDQzVGNjgxMUUwOUJGRENGNEY3OENEQUVCOCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDo5MUE5MDNDRDVGNjgxMUUwOUJGRENGNEY3OENEQUVCOCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOjYwNkEzRkFGNUY2ODExRTA5QkZEQ0Y0Rjc4Q0RBRUI4IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjYwNkEzRkIwNUY2ODExRTA5QkZEQ0Y0Rjc4Q0RBRUI4Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+Af/+/fz7+vn49/b19PPy8fDv7u3s6+rp6Ofm5eTj4uHg397d3Nva2djX1tXU09LR0M/OzczLysnIx8bFxMPCwcC/vr28u7q5uLe2tbSzsrGwr66trKuqqainpqWko6KhoJ+enZybmpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSDgoGAf359fHt6eXh3dnV0c3JxcG9ubWxramloZ2ZlZGNiYWBfXl1cW1pZWFdWVVRTUlFQT05NTEtKSUhHRkVEQ0JBQD8+PTw7Ojk4NzY1NDMyMTAvLi0sKyopKCcmJSQjIiEgHx4dHBsaGRgXFhUUExIREA8ODQwLCgkIBwYFBAMCAQAAIfkEAAAAAAAsAAAAAFAAUAAABPLwyUmrvTjrzbv/YCiOZGmeaKqubOu+cCzPdG3feK7vfO//wKBwSCwaj8ikcslsOp/QqHRKrVqv2KxW2DAACIHHYAEQHC7db3ggACwKwgEgnDA8FoqCQmCR0+0CeQIJQgcAZwgGfg+GYwRiAAiHD4mLiUMJX3MBABMADAUGCHgPmQSbnQ8MqUECCwgECZyeYasGcK6wsqmrQpxwDQCLnAMPnAQFvw/BcoiPQXKgCY+BenyhsArRBdMP1QIOQw2nZmJtAsUCfIYM42VnbAAKW/T19vf4+fr7/P3+/wADChxIsKDBgwgTKlzIsKHDhxAjShwYAQA7",
		tBlob = new Blob(["Hello World!"]);

	/**
	 * $.blob
	 */
	asyncTest("$.blob", function() {
		expect(1);
		var def = $.blob(tURL, {async:true})
		def.then(
			function(arg) {
				ok(arg , arg);
			},
			function(err) {
				ok(false , err);
			}
		);
		def.always(function(){start()});
	});
	

	/**
	 * $.blob.createURL
	 * $.blob.revokeURL
	 */
	var blobURL;
	test("$.blob.createURL", function() {
		blobURL = $.blob.createURL(tBlob);
		ok(blobURL, "get blob url: " + blobURL);
	});
	
	test("$.blob.revokeURL", function() {
		$.blob.revokeURL(blobURL);
		ok(blobURL, "revoke blob url: " + blobURL);
	});
	
	
	/**
	 * $.blob.size
	 */
	test("$.blob.size", function() {
		var size;
		size = $.blob.size(tBlob);
		ok( size === 12, size );
		size = $.blob.size(tBlob, true);
		ok( size === "12.00 bytes" , size );
	});
	
	
	/**
	 * $.blob.convert
	 */
	
	
	/**
	 * $.blob.save
	 */
	 
	/**
	 * $.blob.is
	 */
	test("$.blob.is", function() {
		ok( $.blob.is(null) === false, "null is not a Blob" );
		ok( $.blob.is("wrong", "image") === false, "'wrong' is not a Blob" );
		ok( $.blob.is("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7") === false, "dataURL is not a Blob" );
		ok( $.blob.is(tBlob) === true, "blob is a Blob" );
	});
	
	
	/**
	 * $.blob.readAsArrayBuffer
	 */
	asyncTest("$.blob.readAsArrayBuffer", function() {
		expect(1);
		$.blob.readAsArrayBuffer(tBlob, {async:true}).then(
			function(arg) {
				ok(arg , arg);start();
			},
			function(err) {
				ok(false , err);start();
			}
		);
	});
	
	
	/**
	 * $.blob.readAsBinaryString
	 */
	asyncTest("$.blob.readAsBinaryString", function() {
		expect(1);
		$.blob.readAsBinaryString(tBlob, {async:true}).then(
			function(arg) {
				ok(arg , arg);start();
			},
			function(err) {
				ok(false , err);start();
			}
		);
	});
	
	
	/**
	 * $.blob.readAsDataURL
	 */
	asyncTest("$.blob.readAsDataURL", function() {
		expect(1);
		$.blob.readAsDataURL(tBlob, {async:true}).then(
			function(url) {
				ok(url , url);start();
			},
			function(err) {
				ok(false , err);start();
			}
		);
	});
	
	
	/**
	 * $.blob.readAsText
	 */
	
	
	/**
	 * $.fn.blob
	 */
});