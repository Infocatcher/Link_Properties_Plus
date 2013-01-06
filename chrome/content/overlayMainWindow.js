var linkPropsPlus = {
	validURI: /^(?:(?:https?|ftps?|file|chrome|resource):\/\/|(?:view-source|jar):[\w-]+:|about:)\S+$/,
	get validURIExtract() {
		delete this.validURIExtract;
		return this.validURIExtract = new RegExp(
			String(this.validURI).slice(2, -2) // Remove /^ and $/
		);
	},

	linkURL: "",
	referer: null,

	get ut() {
		var tmp = {};
		Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
			.getService(Components.interfaces.mozIJSSubScriptLoader)
			.loadSubScript("chrome://linkpropsplus/content/utils.js", tmp);
		delete this.ut;
		return this.ut = tmp.linkPropsPlusUtils;
	},
	get pu() {
		return window.linkPropsPlusPrefUtils;
	},

	init: function() {
		window.removeEventListener("load", this, false);
		window.addEventListener("unload", this, false);
		this.cm.addEventListener("popupshowing", this, false);
		this.pu.prefsMigration();
		this.registerHotkeys();
		setTimeout(function(_this) {
			_this.showMenuitems();
			_this.showIcons();
		}, 50, this);
	},
	destroy: function() {
		window.removeEventListener("unload", this, false);
		this.cm.removeEventListener("popupshowing", this, false);
	},
	handleEvent: function(e) {
		switch(e.type) {
			case "load":         this.init();    break;
			case "unload":       this.destroy(); break;
			case "popupshowing":
				if(e.target == e.currentTarget)
					this.setContextMenu();
		}
	},

	get cm() {
		delete this.cm;
		return this.cm = document.getElementById("contentAreaContextMenu")
			|| document.getElementById("mailContext");
	},
	get mi() {
		delete this.mi;
		return this.mi = document.getElementById("linkPropsPlus-contextMenuitem");
	},
	get toolsMi() {
		delete this.toolsMi;
		return this.toolsMi = document.getElementById("linkPropsPlus-toolsMenuitem");
	},
	get toolsMiSub() {
		delete this.toolsMiSub;
		return this.toolsMiSub = document.getElementById("linkPropsPlus-toolsMenuitemSub");
	},
	get appMi() {
		delete this.appMi;
		return this.appMi = document.getElementById("linkPropsPlus-appMenuitem");
	},
	isValidURI: function(s) {
		return s && this.validURI.test(s);
	},

	extractURI: function(s) {
		if(
			!this.validURIExtract.test(s)
			|| RegExp.leftContext.length > 200
			|| RegExp.rightContext.length > 200
		)
			return "";
		var uri = RegExp.lastMatch.replace(/".*$/, "");
		var brackets = {
			"(": ")",
			"[": "]",
			"{": "}",
			"<": ">",
			__proto__: null
		};
		for(var b in brackets)
			if(uri.indexOf(b) == -1)
				uri = uri.replace(new RegExp("\\" + brackets[b] + ".*$"), "");
		return uri.replace(/[.,;]$/, "");
	},
	prefsChanged: function(pName) {
		if(pName.indexOf("showIn") == 0)
			this.showMenuitems();
		else if(pName.indexOf("icon.") == 0)
			this.showIcons();
	},
	showMenuitems: function() {
		var showTools = this.pu.pref("showInToolsMenu");
		var showToolsSub = showTools
			&& this.toolsMiSub
			&& this.pu.pref("showInToolsMenuSub");
		this.toolsMi    && this.toolsMi   .setAttribute("hidden", !(showTools && !showToolsSub));
		this.toolsMiSub && this.toolsMiSub.setAttribute("hidden", !showToolsSub);
		this.appMi      && this.appMi     .setAttribute("hidden", !this.pu.pref("showInAppMenu"));
	},
	showIcons: function() {
		const attr = "lpp_iconized";
		this.mi.setAttribute(attr, this.pu.pref("icon.contextMenu"));
		var iconTools = this.pu.pref("icon.toolsMenu");
		this.toolsMi    && this.toolsMi   .setAttribute(attr, iconTools);
		this.toolsMiSub && this.toolsMiSub.setAttribute(attr, iconTools);
		this.appMi      && this.appMi     .setAttribute(attr, this.pu.pref("icon.appMenu"));
	},
	setContextMenu: function() {
		var hide = true;
		var uri = "";
		this.linkURL = this.referer = "";
		if(
			gContextMenu
			&& gContextMenu.onSaveableLink
			&& this.pu.pref("context.onLinks")
		) {
			uri = typeof gContextMenu.linkURL == "function" // SeaMonkey
				? gContextMenu.linkURL()
				: gContextMenu.linkURL;
			if(this.isValidURI(uri)) {
				this.linkURL = uri;
				this.referer = gContextMenu.link.ownerDocument.location.href;
				hide = false;
			}
		}
		else if(this.pu.pref("context.onSelection")) {
			var sel = document.commandDispatcher.focusedWindow.getSelection().toString();
			uri = this.extractURI(sel);
			if(uri) {
				this.linkURL = uri;
				this.referer = null; //gContextMenu.target.ownerDocument.location.href;
				hide = false;
			}
		}
		var mi = this.mi;
		mi.hidden = hide;
		if(!hide) {
			var decoded = this.ut.decodeURI(uri);
			mi.setAttribute("tooltiptext", decoded);
			var crop = this.pu.pref("context.onSelection.cropLinkInLabel") || 0;
			if(!("_lppLabel" in mi))
				mi._lppLabel = mi.getAttribute("label");
			var label = sel && crop > 0
				? mi.getAttribute("lpp_label_for")
					.replace("$S", decoded.length > crop ? decoded.substr(0, crop) + "…" : decoded)
				: mi._lppLabel;
			if(mi.getAttribute("label") != label)
				mi.setAttribute("label", label);
		}
	},
	readFromClipboard: function() {
		// For Thunderbird
		// Based on function readFromClipboard() from chrome://browser/content/browser.js
		var str = "";
		try {
			var cb = Components.classes["@mozilla.org/widget/clipboard;1"]
				.getService(Components.interfaces.nsIClipboard);
			var trans = Components.classes["@mozilla.org/widget/transferable;1"]
				.createInstance(Components.interfaces.nsITransferable);
			trans.addDataFlavor("text/unicode");
			var cbId = cb.supportsSelectionClipboard() ? cb.kSelectionClipboard : cb.kGlobalClipboard;
			cb.getData(trans, cbId);
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
	openWindow: function(uri, referer, win, tab) {
		if(!uri) {
			uri = this.readFromClipboard();
			if(!this.isValidURI(uri))
				uri = "";
		}
		if(!referer)
			referer = content.location.href;
		this.ut.openWindow(uri, referer, arguments.length > 0, win, tab);
	},
	openWindowContext: function() {
		this.openWindow(this.linkURL, this.referer, window, "gBrowser" in window && gBrowser.selectedTab);
	},

	// Hotkeys:
	registerHotkeys: function() {
		this.pu.prefSvc.getBranch(this.pu.prefNS + "key.")
			.getChildList("", {})
			.forEach(this.registerHotkey, this);
	},
	registerHotkey: function(kId) {
		var kElt = document.getElementById("linkPropsPlus-key-" + kId);
		if(!kElt)
			return; //~ todo: show warning in console
		var keyStr = this.pu.pref("key." + kId);
		if(!keyStr) { // Key is disabled
			// Strange things may happens without this for <key command="..." />
			kElt.parentNode.removeChild(kElt);
			return;
		}
		var tokens = keyStr.split(" ");
		var key = tokens.pop() || " ";
		var modifiers = tokens.join(",");
		kElt.removeAttribute("disabled");
		kElt.setAttribute(key.indexOf("VK_") == 0 ? "keycode" : "key", key);
		kElt.setAttribute("modifiers", modifiers);
	}
};
window.addEventListener("load", linkPropsPlus, false);