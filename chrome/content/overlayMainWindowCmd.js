var linkPropsPlusCmd = {
	get lpp() {
		return window.linkPropsPlus;
	},

	linkURL: "",
	referer: "",
	sourceWindow: null,

	validURI: /^(?:(?:(?:https?|ftps?|file|chrome|resource):\/\/+|(?:view-source|jar):[\w-]+:\/*)[^\/]\S*|about:(?:[^\/]\S*)?)$/,
	get validURIExtract() {
		delete this.validURIExtract;
		return this.validURIExtract = new RegExp(
			String(this.validURI).slice(2, -2) // Remove /^ and $/
		);
	},

	isValidURI: function(s) {
		return s && this.validURI.test(s);
	},
	extractURI: function(s) {
		if(!this.validURIExtract.test(s))
			return "";
		var uri = RegExp.lastMatch;
		var before = RegExp.leftContext;
		var after = RegExp.rightContext;
		if(this.lpp.pu.get("context.onSelection.ignoreSpaces")) {
			before = before.replace(/\s+$/, "");
			after = after.replace(/^\s+/, "");
		}
		var threshold = this.lpp.pu.get("context.onSelection.detectionThreshold");
		if(
			before.length > threshold
			|| after.length > threshold
		)
			return "";
		uri = uri.replace(/".*$/, "");
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

	setContextMenu: function() {
		this.destroyContextMenu();
		var hide = true;
		var uri = "";
		if(
			gContextMenu
			&& gContextMenu.onSaveableLink
			&& this.lpp.pu.get("context.onLinks")
		) {
			uri = typeof gContextMenu.linkURL == "function" // SeaMonkey
				? gContextMenu.linkURL()
				: gContextMenu.linkURL;
			if(this.isValidURI(uri)) {
				var sourceDoc = gContextMenu.ownerDoc
					|| gContextMenu.target && gContextMenu.target.ownerDocument;
				this.linkURL = uri;
				this.referer = this._getContextReferer(sourceDoc);
				this.sourceWindow = sourceDoc.defaultView;
				hide = false;
			}
		}
		else if(this.lpp.pu.get("context.onSelection")) {
			var selObj = document.commandDispatcher.focusedWindow.getSelection();
			var sel = selObj.toString();
			if(
				!sel && gContextMenu && "selectionInfo" in gContextMenu // e10s-compatible
				&& (
					!gContextMenu.selectionInfo.docSelectionIsCollapsed // Document selection
					|| this.lpp.pu.get("context.onSelection.inInputFields") // Or looks like input field
				)
			) {
				sel = gContextMenu.selectionInfo.text;
			}
			if(
				!sel
				&& gContextMenu && gContextMenu.target
				&& this.lpp.pu.get("context.onSelection.inInputFields")
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
				uri = sel = gContextMenu.linkURL;
			if(uri) {
				var sourceDoc = gContextMenu && (
						gContextMenu.ownerDoc
						|| gContextMenu.target && gContextMenu.target.ownerDocument
					)
					|| selObj.getRangeAt(0).commonAncestorContainer.ownerDocument; // For SeaMonkey
				this.linkURL = uri;
				this.referer = this.lpp.pu.get("useRealRefererForTextLinks")
					? this._getContextReferer(sourceDoc)
					: null;
				this.sourceWindow = sourceDoc.defaultView;
				hide = false;
			}
		}
		var mi = this.lpp.mi;
		mi.hidden = hide;
		if(!hide) {
			var decoded = this.lpp.ut.decodeURI(uri);
			mi.setAttribute("tooltiptext", decoded);
			var crop = this.lpp.pu.get("context.onSelection.cropLinkInLabel");
			var label = sel && crop > 0
				? mi.getAttribute("lpp_label_for")
					.replace("$S", decoded.length > crop ? decoded.substr(0, crop) + "…" : decoded)
				: mi.getAttribute("lpp_label");
			if(mi.getAttribute("label") != label)
				mi.setAttribute("label", label);
		}
	},
	destroyContextMenu: function() {
		this.linkURL = this.referer = "";
		this.sourceWindow = null;
	},
	_getContextReferer: function(doc) {
		return "gContextMenuContentData" in window && gContextMenuContentData
			&& "documentURIObject" in gContextMenuContentData
			? gContextMenuContentData.documentURIObject.spec
			: doc.documentURI;
	},

	get contentWindow() {
		return window.gBrowser && gBrowser.contentWindow
			|| window.content
			|| null;
	},
	openWindow: function(e, options) {
		if(!options)
			options = {};
		options.autostart = e
			? e.type == "click" || e.ctrlKey || e.altKey || e.shiftKey || e.metaKey
			: !!options.uri;
		if(!options.uri && this.lpp.pu.get("preferSelectionClipboard")) {
			var clipUriSel = this.lpp.ut.readFromClipboard(true);
			if(this.isValidURI(clipUriSel))
				options.uri = clipUriSel;
		}
		if(!options.uri) {
			var clipUri = this.lpp.ut.readFromClipboard();
			if(this.isValidURI(clipUri))
				options.uri = clipUri;
		}
		if(!("referer" in options) || !options.referer && options.referer !== null) {
			options.referer = window.gBrowser && gBrowser.currentURI.spec
				|| window.content && content.location.href
				|| "";
		}
		if(!options.sourceWindow)
			options.sourceWindow = this.contentWindow;
		if(!options.parentWindow)
			options.parentWindow = window;
		if(!options.sourceTab)
			options.sourceTab = "gBrowser" in window && gBrowser.selectedTab;
		this.lpp.ut.openWindow(options);
	},
	openWindowContext: function() {
		this.lpp.ut.openWindow({
			uri:          this.linkURL,
			referer:      this.referer,
			sourceWindow: this.sourceWindow || this.contentWindow,
			autostart:    true,
			parentWindow: window,
			sourceTab:    "gBrowser" in window && gBrowser.selectedTab
		});
	}
};