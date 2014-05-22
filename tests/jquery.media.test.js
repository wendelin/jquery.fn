require(["jquery.media"], function ($) {
	module("jquery.media");
	
	test("$.fn.media", function() {
		ok(
			$("<video/>")
				.media({src:"movie.mp4",type:'audio/mp4; codecs="mp4a.40.2"'})
				.find("source")
				.size() === 1,
			"set single source"
		);
		
		ok(
			$("<video/>")
				.media([
					{src:"movie.ogg", type:'video/ogg; codecs="theora, vorbis"'},
					{src:"movie.mp4", type:'video/mp4; codecs="avc1.4D401E, mp4a.40.2"'}
				])
				.find("source")
				.size() === 2,
			"set two sources"
		);
	});
});