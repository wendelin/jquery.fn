/**
 * @copyright Copyright 2014 Wendelin Thomas. All rights reserved
 * Licensed under the MIT License.
 * @see https://github.com/wendelin/jquery.fn/blob/gh-pages/LICENSE.md
 * @requires jquery.notification
 * @requires bootstrap
 * @augments jquery.notification
 * @module jquery.notification.bootstrap
 */
(function (factory) {
if (typeof define === "function" && define.amd) {
	// AMD. Register as a module depending on jQuery.
	define("jquery.notification.bootstrap",["jquery.notification"], factory);
} else {
	// No AMD. Register plugin with global jQuery object.
	factory(jQuery);
}
}(function($){
	"use strict";
	
	/**
	 * @private
	 * @method $.notification.types.bootstrap
	 */
	$.notification.types.bootstrap = function (title, options, events) {
		options = options || {};
		var $div;
		if (options.tag) {
			$div = $("[data-notification-tag='" + options.tag + "']").first();
		}
		if (!$div || !$div.size()) {
			var pseudoType = "info";
			if (/^(success|info|warning|danger)/.test(options.tag)) {
				pseudoType = options.tag.match(/^(success|info|warning|danger)/)[0];
			}
			
			// aria-live="' + ((pseudoType === "warning" || pseudoType === "danger") ? 'assertive' : 'polite') + '" 
			$div = $('<div role="dialog" class="alert alert-' + pseudoType + '"></div>');
			
			if (options.tag) {
				$div.attr("data-notification-tag", options.tag);
			}
		};
		
		$div.off().empty();
		
		$div.append('<button type="button" class="close" data-dismiss="alert" title="close"><span aria-hidden="true">&times;</div></button>',
			$('<div></div>').append(
				$('<strong></strong>').text(title).appendTo($div)
			)
		);
		
		if (options.body) {
			$('<span></span>').text(options.body).appendTo($div);
		}
		
		if (events && events.show) events.show();
		
		$('#notifications').prepend($div);
		
		var close = $div.close = function () {
			if (events && events.close) events.close();
			close = $div.close = function(){
				$div.remove();
			};
			$div
			.attr({
				"data-notification-tag":"",
				"aria-hidden":"true"
			})
			.fadeTo("slow",0)
			.slideUp(function(){
				$div.remove();
			});
			/*
			.animate({ height: 'toggle', opacity: 'toggle' }, 'slow', function(){
				$div.remove();
			});
			*/
		};
		
		$div.on("click","button", function (e) {
			e.stopPropagation();
			e.preventDefault();
			close();
		});
		
		if (events && events.click) $div.on("click","div", events.click);
		
		return $div;
	};
	
	// Change $.notification to use bootstrap alerts by default.
	$.notification.defaultType = "bootstrap";
	
}));