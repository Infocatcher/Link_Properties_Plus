var linkPropsPlus = {
	validURI: /^(?:(?:https?|ftps?|file|chrome|resource):\/\/|(?:view-source|jar):[\w-]+:|about:)\S+$/,
	get validURIExtract() {
		delete this.validURIExtract;
		return this.validURIExtract = new RegExp(
			String(this.validURI).slice(2, -2) // Remove /^ and $/
		);
	},

	linkURL: "",
	referer: "",
	sourceWindow: null,

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
		this.cm.addEventListener("popuphidden", this, false);
		this.pu.init();
		setTimeout(function(_this) {
			_this.showMenuitems();
			_this.showIcons();
		}, 50, this);
	},
	destroy: function() {
		window.removeEventListener("unload", this, false);
		this.cm.removeEventListener("popupshowing", this, false);
		this.cm.removeEventListener("popuphidden", this, false);
	},
	handleEvent: function(e) {
		switch(e.type) {
			case "load":         this.init();                                              break;
			case "unload":       this.destroy();                                           break;
			case "popupshowing": e.target == e.currentTarget && this.setContextMenu();     break;
			case "popuphidden":  e.target == e.currentTarget && this.destroyContextMenu();
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
		this.destroyContextMenu();
		var hide = true;
		var uri = "";
		if(
			gContextMenu
			&& gContextMenu.onSaveableLink
			&& this.pu.pref("context.onLinks")
		) {
			uri = typeof gContextMenu.linkURL == "function" // SeaMonkey
				? gContextMenu.linkURL()
				: gContextMenu.linkURL;
			if(this.isValidURI(uri)) {
				var sourceDoc = gContextMenu.link.ownerDocument;
				this.linkURL = uri;
				this.referer = sourceDoc.location.href;
				this.sourceWindow = sourceDoc.defaultView;
				hide = false;
			}
		}
		else if(this.pu.pref("context.onSelection")) {
			var selObj = document.commandDispatcher.focusedWindow.getSelection();
			var sel = selObj.toString();
			if(
				!sel
				&& gContextMenu && gContextMenu.target
				&& this.pu.pref("context.onSelection.inInputFields")
			) {
				var trg = gContextMenu.target;
				if(
					trg instanceof HTMLTextAreaElement
					|| trg instanceof HTMLInputElement && trg.type != "password"
				) try {
					sel = trg.value.substring(trg.selectionStart, trg.selectionEnd);
				}
				catch(e) { // Non-text HTMLInputElement
				}
			}
			uri = this.extractURI(sel);
			if(uri) {
				var sourceDoc = gContextMenu && gContextMenu.target && gContextMenu.target.ownerDocument
					|| selObj.getRangeAt(0).commonAncestorContainer.ownerDocument; // For SeaMonkey
				this.linkURL = uri;
				this.referer = this.pu.pref("useRealRefererForTextLinks")
					? sourceDoc.location.href
					: null;
				this.sourceWindow = sourceDoc.defaultView;
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
	destroyContextMenu: function() {
		this.linkURL = this.referer = "";
		this.sourceWindow = null;
	},

	buttonDragOver: function(e) {
		if(this.hasDropLink(e)) {
			var dt = e.dataTransfer;
			dt.effectAllowed = dt.dropEffect = "link";
			e.preventDefault();
			e.stopPropagation();
		}
	},
	buttonDrop: function(e) {
		var data = this.getDropLink(e);
		if(data)
			this.openWindow(data.uri, data.referer);
	},
	hasDropLink: function(e) {
		return !!this.getDropLink(e);
	},
	getDropLink: function(e) {
		var uri;
		var dt = e.dataTransfer;
		var types = dt.types;
		if(types.contains("text/x-moz-url"))
			uri = dt.getData("text/x-moz-url").split("\n")[0];
		else if(types.contains("text/plain"))
			uri = this.extractURI(dt.getData("text/plain"));
		var sourceNode = dt.mozSourceNode || dt.sourceNode || null;
		return uri && {
			uri: uri,
			referer: sourceNode && sourceNode.ownerDocument && sourceNode.ownerDocument.documentURI || null
		};
	},

	readFromClipboard: function() {
		// See chrome://browser/content/browser.js
		if("readFromClipboard" in window)
			return readFromClipboard() || "";

		// Fallback implementation for Thunderbird
		// Based on code from Firefox 20.0a1 (2013-01-06)
		var str = "";
		try {
			var cb = Components.classes["@mozilla.org/widget/clipboard;1"]
				.getService(Components.interfaces.nsIClipboard);
			var trans = Components.classes["@mozilla.org/widget/transferable;1"]
				.createInstance(Components.interfaces.nsITransferable);
			trans.addDataFlavor("text/unicode");
			if("init" in trans) {
				trans.init(
					window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
						.getInterface(Components.interfaces.nsIWebNavigation)
						.QueryInterface(Components.interfaces.nsILoadContext)
				);
			}
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
	openWindow: function(uri, referer, sourceWindow, browserWindow, sourceTab) {
		if(!uri) {
			var clipUri = this.readFromClipboard();
			if(this.isValidURI(clipUri))
				uri = clipUri;
		}
		if(!referer && referer !== null)
			referer = content.location.href;
		if(!sourceWindow)
			sourceWindow = content;
		this.ut.openWindow(uri, referer, sourceWindow, arguments.length > 0, browserWindow, sourceTab);
	},
	openWindowContext: function() {
		this.openWindow(
			this.linkURL,
			this.referer,
			this.sourceWindow,
			window,
			"gBrowser" in window && gBrowser.selectedTab
		);
	}
};
window.addEventListener("load", linkPropsPlus, false);