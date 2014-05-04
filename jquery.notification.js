/**
 * <p>Wrapper and fallback for the "notification" API.</p>
 * 
 * <p>Options:</p>
 * <dl>
 *   <dt>dir</dt>      <dd>The direction of the notification; it can be auto, ltr, or rtl</dd>
 *   <dt>lang</dt>     <dd>Specifiy the lang used within the notification. This string must be a valid BCP 47 language tag.</dd>
 *   <dt>body</dt>     <dd>A string representing an extra content to display within the notification</dd>
 *   <dt>tag</dt>      <dd>An ID for a given notification that allows to retrieve, replace or remove it if necessary</dd>
 *   <dt>icon</dt>     <dd>The URL of an image to be used as an icon by the notification</dd>
 * </dl>
 *
 * @see https://developer.mozilla.org/en/docs/Web/API/notification
 *
 * @example $.notification("foo");
 * @example $.notification("foo", {body:"bar"});
 * @example $.notification("Hit me", {}, {
 *       show: function(){$.notification("Hello");},
 *       close: function(){$.notification("Bye");},
 *       click: function(){$.notification("Clicked");},
 *       error: function(){$.notification("Error");}
 *   })
 * @method $.Notification
 * @param {String} title
 * @param {Object.<({dir:String.<'auto','ltr','rtl'>,lang:String,body:String,tag:String,icon:URL})>} options
 * @param {Object} events Optional events
 */
$.notification = (function(){
	var Notification = window.Notification || window.mozNotification || webkitNotification;
	
	var notify = function (title, options, events) {
		options = options || {};
		if (fn.useNative && options.useNative !== false  && Notification && Notification.permission === "granted") {
			var n = new Notification(title,options);
			if (events) $(n).on(events);
			return n;
		} else {
			return fn.fallback(title, options, events);
		}
	};
	
	var fn = function (title, options, events) {
		options = options || {};
		console.log("fn", arguments);
		if (fn.useNative && options.useNative !== false && Notification && Notification.permission === "default") {
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
