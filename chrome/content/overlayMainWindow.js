var linkPropsPlus = {
	validURI: /^(?:(?:(?:https?|ftps?|file|chrome|resource):\/\/+|(?:view-source|jar):[\w-]+:\/*)[^\/]\S*|about:(?:[^\/]\S*)?)$/,
	get validURIExtract() {
		delete this.validURIExtract;
		return this.validURIExtract = new RegExp(
			String(this.validURI).slice(2, -2) // Remove /^ and $/
		);
	},

	linkURL: "",
	referer: "",
	sourceWindow: null,

	get ut()  { return this.lazy("ut",  "linkPropsPlusUtils",     "utils.js");                },
	get pu()  { return this.lazy("pu",  "linkPropsPlusPrefUtils", "prefUtils.js");            },
	get dnd() { return this.lazy("dnd", "linkPropsPlusDND",       "overlayMainWindowDND.js"); },
	get scriptLoader() {
		delete this.scriptLoader;
		return this.scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
			.getService(Components.interfaces.mozIJSSubScriptLoader);
	},
	lazy: function(s, p, file) {
		this.scriptLoader.loadSubScript("chrome://linkpropsplus/content/" + file, window, "UTF-8");
		delete this[s];
		return this[s] = window[p];
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
	prefsChanged: function(pName, pVal) {
		if(pName.indexOf("showIn") == 0)
			this.showMenuitems();
		else if(pName.indexOf("icon.") == 0)
			this.showIcons();
	},
	showMenuitems: function() {
		var showTools = this.pu.get("showInToolsMenu");
		var showToolsSub = showTools
			&& this.toolsMiSub
			&& this.pu.get("showInToolsMenuSub");
		this.toolsMi    && this.toolsMi   .setAttribute("hidden", !(showTools && !showToolsSub));
		this.toolsMiSub && this.toolsMiSub.setAttribute("hidden", !showToolsSub);
		this.appMi      && this.appMi     .setAttribute("hidden", !this.pu.get("showInAppMenu"));
	},
	showIcons: function() {
		const attr = "lpp_iconized";
		this.mi.setAttribute(attr, this.pu.get("icon.contextMenu"));
		var iconTools = this.pu.get("icon.toolsMenu");
		this.toolsMi    && this.toolsMi   .setAttribute(attr, iconTools);
		this.toolsMiSub && this.toolsMiSub.setAttribute(attr, iconTools);
		this.appMi      && this.appMi     .setAttribute(attr, this.pu.get("icon.appMenu"));
	},
	setContextMenu: function() {
		this.destroyContextMenu();
		var hide = true;
		var uri = "";
		if(
			gContextMenu
			&& gContextMenu.onSaveableLink
			&& this.pu.get("context.onLinks")
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
		else if(this.pu.get("context.onSelection")) {
			var selObj = document.commandDispatcher.focusedWindow.getSelection();
			var sel = selObj.toString();
			if(
				!sel
				&& gContextMenu && gContextMenu.target
				&& this.pu.get("context.onSelection.inInputFields")
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
			if(
				!uri // Fallback for Electrolysis + easy way to detect strings like "example.com"
				&& gContextMenu && gContextMenu.onPlainTextLink
				&& typeof gContextMenu.linkURL == "string"
			)
				uri = gContextMenu.linkURL;
			if(uri) {
				var sourceDoc = gContextMenu && gContextMenu.target && gContextMenu.target.ownerDocument
					|| selObj.getRangeAt(0).commonAncestorContainer.ownerDocument; // For SeaMonkey
				this.linkURL = uri;
				this.referer = this.pu.get("useRealRefererForTextLinks")
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
			var crop = this.pu.get("context.onSelection.cropLinkInLabel") || 0;
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

	openWindow: function(e, uri, referer, sourceWindow, browserWindow, sourceTab) {
		var autostart = e
			? e.type == "click" || e.ctrlKey || e.altKey || e.shiftKey || e.metaKey
			: !!uri;
		if(!uri && this.pu.get("preferSelectionClipboard")) {
			var clipUriSel = this.ut.readFromClipboard(true);
			if(this.isValidURI(clipUriSel))
				uri = clipUriSel;
		}
		if(!uri) {
			var clipUri = this.ut.readFromClipboard();
			if(this.isValidURI(clipUri))
				uri = clipUri;
		}
		if(!referer && referer !== null)
			referer = content.location.href;
		if(!sourceWindow)
			sourceWindow = content;
		this.ut.openWindow(uri, referer, sourceWindow, autostart, browserWindow, sourceTab);
	},
	openWindowContext: function() {
		this.ut.openWindow(
			this.linkURL,
			this.referer,
			this.sourceWindow || content,
			true,
			window,
			"gBrowser" in window && gBrowser.selectedTab
		);
	}
};
window.addEventListener("load", linkPropsPlus, false);