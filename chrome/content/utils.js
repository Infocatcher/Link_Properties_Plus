var linkPropsPlusUtils = {
	get pu() {
		return window.linkPropsPlusPrefUtils;
	},
	get wm() {
		delete this.wm;
		return this.wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
	},

	openWindow: function(uri, referer, autostart, win, tab) {
		var ws = this.wm.getEnumerator("linkPropsPlus:ownWindow");
		while(ws.hasMoreElements()) {
			var w = ws.getNext();
			var o = w.linkPropsPlusWnd;
			if(o && o.uri == uri && o.referer == referer) {
				w.focus();
				o.svc.restartAutoClose();
				return;
			}
		}
		window.openDialog(
			"chrome://linkpropsplus/content/ownWindow.xul",
			"_blank",
			"chrome,resizable,centerscreen,dialog=0",
			uri, referer, autostart, win, tab
		);
	},
	decodeURI: function(uri) {
		if(!this.pu.pref("decodeURIs"))
			return uri;

		var win = this.wm.getMostRecentWindow("navigator:browser");
		if(win && "losslessDecodeURI" in win) try {
			return win.losslessDecodeURI({ spec: uri });
		}
		catch(e) {
			Components.utils.reportError(e);
		}

		// Based on losslessDecodeURI() function from
		// chrome://browser/content/browser.js in Firefox 19.0a1 (2012-11-05)

		// Try to decode as UTF-8 if there's no encoding sequence that we would break.
		if(!/%25(?:3B|2F|3F|3A|40|26|3D|2B|24|2C|23)/i.test(uri)) try {
			uri = decodeURI(uri)
				// 1. decodeURI decodes %25 to %, which creates unintended
				//    encoding sequences. Re-encode it, unless it's part of
				//    a sequence that survived decodeURI, i.e. one for:
				//    ';', '/', '?', ':', '@', '&', '=', '+', '$', ',', '#'
				//    (RFC 3987 section 3.2)
				// 2. Re-encode whitespace so that it doesn't get eaten away
				//    by the location bar (bug 410726).
				.replace(/%(?!3B|2F|3F|3A|40|26|3D|2B|24|2C|23)|[\r\n\t]/ig, encodeURIComponent);
		}
		catch (e) {
			Components.utils.reportError(e);
		}

		// Encode invisible characters (line and paragraph separator,
		// object replacement character) (bug 452979)
		uri = uri.replace(/[\v\x0c\x1c\x1d\x1e\x1f\u2028\u2029\ufffc]/g, encodeURIComponent);

		// Encode default ignorable characters (bug 546013)
		// except ZWNJ (U+200C) and ZWJ (U+200D) (bug 582186).
		// This includes all bidirectional formatting characters.
		// (RFC 3987 sections 3.2 and 4.1 paragraph 6)
		uri = uri.replace(
			/[\u00ad\u034f\u115f-\u1160\u17b4-\u17b5\u180b-\u180d\u200b\u200e-\u200f\u202a-\u202e\u2060-\u206f\u3164\ufe00-\ufe0f\ufeff\uffa0\ufff0-\ufff8]|\ud834[\udd73-\udd7a]|[\udb40-\udb43][\udc00-\udfff]/g,
			encodeURIComponent
		);
		return uri;
	},
	get strings() {
		delete this.strings;
		return this.strings = Components.classes["@mozilla.org/intl/stringbundle;1"]
			.getService(Components.interfaces.nsIStringBundleService)
			.createBundle("chrome://linkpropsplus/locale/linkPropsPlus.properties");
	},
	getLocalized: function(id, params) {
		try {
			if(params)
				return this.strings.formatStringFromName(id, params, params.length);
			return this.strings.GetStringFromName(id);
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		return id;
	}
};