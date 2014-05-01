/**
 * See: https://developer.mozilla.org/en/docs/Web/API/notification
 *
 * Examples:
 * - $.notification("foo");
 * - $.notification("foo", {body:"bar"});
 * - $.notification("Hit me", {}, {
 *       show: function(){$.notification("Hello");},
 *       close: function(){$.notification("Bye");},
 *       click: function(){$.notification("Clicked");},
 *       error: function(){$.notification("Error");}
 *   })
 *
 * Options:
 * - dir : The direction of the notification; it can be auto, ltr, or rtl
 * - lang: Specifiy the lang used within the notification. This string must be a valid BCP 47 language tag.
 * - body: A string representing an extra content to display within the notification
 * - tag: An ID for a given notification that allows to retrieve, replace or remove it if necessary
 * - icon: The URL of an image to be used as an icon by the notification
 *
 * @method $.Notification
 * @param title {String}
 * @param options {Object}
 * @param events {Object} Optional events
 */
$.notification = (function(){
	var Notification = window.Notification || window.mozNotification || webkitNotification;

	var notify = function (title, options, events) {
		if (fn.useNative && Notification && Notification.permission === "granted") {
			var n = new Notification(title,options);
			if (events) $(n).on(events);
			return n;
		} else {
			return fn.fallback(title, options, events);
		}
	};

	var fn = function (title, options, events) {
		if (fn.useNative && Notification && Notification.permission === "default") {
			return fn.requestPermission().always(function(){
				notify(title, options, events);
			});
			
		} else {
			return notify(title, options, events);
		}
	};
	
	$.extend(fn, {
		useNative: !! Notification,
		fallback: function (title, options, events) {
			if (events && events.show) events.show();
			alert(title + (options && options.body ? "\n\n" + options.body : ""));
			if (events && events.close) events.close();
		},
		requestPermissionsTimeout: 10000, /* milliseconds */
		requestPermission: function(){
			var d = new $.Deferred();
			
			Notification.requestPermission(function (status) {
				if (Notification.permission !== status) {
					Notification.permission = status;
				}
				d.resolve(status);
			});
			
			setTimeout(function(){
				if (d.state() === "pending") {
					d.reject();
				}
			}, fn.requestPermissionsTimeout);
			
			return d;
		}
	});
	
	return fn;
}());
