var linkPropsPlusUtils = {
	// We use following mask to not use internal or file:// links as referers
	validReferer: /^(?:http|ftp)s?:\/\/\S+$/,

	get pu() {
		return window.linkPropsPlusPrefUtils;
	},
	get wm() {
		delete this.wm;
		return this.wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
	},
	get ios() {
		delete this.ios;
		return this.ios = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
	},
	get pbu() {
		if(!("PrivateBrowsingUtils" in window)) try {
			Components.utils["import"]("resource://gre/modules/PrivateBrowsingUtils.jsm");
		}
		catch(e) {
		}
		delete this.pbu;
		return this.pbu = "PrivateBrowsingUtils" in window ? PrivateBrowsingUtils : null;
	},

	openWindow: function(uri, referer, sourceWindow, autostart, browserWindow, sourceTab) {
		var ws = this.wm.getEnumerator("linkPropsPlus:ownWindow");
		var _uri = uri || "";
		var _referer = this.checkReferer(referer, _uri) || "";
		while(ws.hasMoreElements()) {
			var w = ws.getNext();
			var o = w.linkPropsPlusWnd;
			if(
				o
				&& (o.uri || "") == _uri
				&& (o.referer || "") == _referer
				&& o.svc.isPrivate == this.isWindowPrivate(sourceWindow)
			) {
				w.focus();
				o.svc.restartAutoClose();
				if(autostart && !o.autostart && !o.svc.activeRequest && !o.svc.requestFinished)
					o.getHeaders();
				return;
			}
		}
		window.openDialog(
			"chrome://linkpropsplus/content/ownWindow.xul",
			"_blank",
			"chrome,resizable,centerscreen,dialog=0",
			{
				uri: uri,
				referer: referer,
				sourceWindow: sourceWindow,
				autostart: autostart,
				parentWindow: browserWindow,
				sourceTab: sourceTab
			}
		);
	},
	allowOpen: function(n) {
		var max = this.pu.get("openMultipleLimit") || 0;
		if(n <= max)
			return true;
		return Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Components.interfaces.nsIPromptService)
			.confirm(
				window,
				this.getLocalized("openMultipleLimitTitle"),
				this.getLocalized("openMultipleLimitMessage", [n])
			);
	},
	isWindowPrivate: function(win) {
		if(!win)
			return false;
		var pbu = this.pbu;
		return pbu && pbu.isWindowPrivate(win);
	},
	get sendReferer() {
		return this.pu.getPref("network.http.sendRefererHeader", 2) > 1;
	},
	isValidReferer: function(s) {
		return s && this.validReferer.test(s);
	},
	checkReferer: function(referer, uri) {
		if(!this.sendReferer) {
			if(!this.pu.get("useFakeReferer.force"))
				return undefined;
			referer = ""; // Make it "invalid"
		}
		if(this.isValidReferer(referer))
			return referer;
		referer = this.getFakeReferer(uri);
		if(this.isValidReferer(referer))
			return referer;
		return undefined;
	},
	getFakeReferer: function(uri, type) {
		if(type === undefined)
			type = this.pu.get("useFakeReferer");
		switch(type) {
			case 1:
				try {
					var uriObj = this.ios.newURI(uri, null, null);
					// Thanks to RefControl https://addons.mozilla.org/firefox/addon/refcontrol/
					return uriObj.scheme + "://" + uriObj.hostPort + "/";
				}
				catch(e) { // Will use "uri" as referer
				}
			case 2:
				return uri;
		}
		return "";
	},
	decodeURI: function(uri) {
		if(!this.pu.get("decodeURIs"))
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
	get clipboard() {
		delete this.clipboard;
		return this.clipboard = Components.classes["@mozilla.org/widget/clipboard;1"]
			.getService(Components.interfaces.nsIClipboard);
	},
	readFromClipboard: function(useSelection) {
		// Based on readFromClipboard() function from
		// chrome://browser/content/browser.js in Firefox 30.0a1 (2014-03-08)
		var str = "";
		try {
			var cb = this.clipboard;
			if(useSelection && !cb.supportsSelectionClipboard())
				return "";
			var trans = Components.classes["@mozilla.org/widget/transferable;1"]
				.createInstance(Components.interfaces.nsITransferable);
			if("init" in trans) try {
				trans.init(
					window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
						.getInterface(Components.interfaces.nsIWebNavigation)
						.QueryInterface(Components.interfaces.nsILoadContext)
				);
			}
			catch(e2) {
				Components.utils.reportError(e2);
			}
			trans.addDataFlavor("text/unicode");
			cb.getData(trans, useSelection ? cb.kSelectionClipboard : cb.kGlobalClipboard);
			var data = {};
			var dataLen = {};
			trans.getTransferData("text/unicode", data, dataLen);
			if(data) {
				data = data.value.QueryInterface(Components.interfaces.nsISupportsString);
				str = data.data.substring(0, dataLen.value/2);
			}
		}
		catch(e) {
		}
		return str;
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
			this.error('Can\'t get localized string for "' + id + '"', Components.stack.caller);
			Components.utils.reportError(e);
		}
		return id;
	},
	error: function(msg, caller, isWarning) {
		if(!caller)
			caller = Components.stack.caller;
		var err = Components.classes["@mozilla.org/scripterror;1"]
			.createInstance(Components.interfaces.nsIScriptError);
		err.init(
			"[Link Properties Plus]: " + msg,
			caller.filename || caller.fileName, // Allow use new Error() as caller
			null,
			caller.lineNumber || 0,
			caller.columnNumber || 0, // Doesn't exist for now
			isWarning ? err.warningFlag : err.errorFlag,
			null
		);
		Components.classes["@mozilla.org/consoleservice;1"]
			.getService(Components.interfaces.nsIConsoleService)
			.logMessage(err);
	},
	warning: function(msg) {
		this.error(msg, Components.stack.caller, true);
	}
};