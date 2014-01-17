var linkPropsPlusSvc = {
	activeRequest: false,
	requestFinished: false,
	channel: null,
	realCount: 0,
	redirects: [],
	requestHash: "",

	// Block Escape key directly after request finished to don't close window instead of request cancellation
	blockEscapeKey: false,
	blockEscapeKeyTimer: 0,
	get blockEscapeKeyDelay() {
		return this.pu.pref("blockEscapeKeyDelay");
	},

	// We use following mask to not use internal or file:// links as referers
	validReferer: /^(?:http|ftp)s?:\/\/\S+$/,

	get ut() {
		return window.linkPropsPlusUtils;
	},
	get pu() {
		return window.linkPropsPlusPrefUtils;
	},
	get wnd() {
		return window.linkPropsPlusWnd;
	},

	get ios() {
		delete this.ios;
		return this.ios = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
	},
	get isOwnWindow() {
		delete this.isOwnWindow;
		return this.isOwnWindow = "linkPropsPlusWnd" in window;
	},
	get isDownloadDialog() {
		delete this.isDownloadDialog;
		return this.isDownloadDialog = "HelperApps" in window;
	},
	get isPropsDialog() {
		delete this.isPropsDialog;
		return this.isPropsDialog = "showMetadataFor" in window;
	},
	get windowType() {
		var wt;
		if(this.isOwnWindow)
			wt = "ownWindow";
		else if(this.isDownloadDialog)
			wt = "download";
		else if(this.isPropsDialog)
			wt = "properties";
		delete this.windowType;
		return this.windowType = wt;
	},
	get testResumability() {
		return this.pu.pref("testDownloadResumability") && (
			!this.isDownloadDialog
			|| this.pu.pref("testDownloadResumability.download")
		);
	},
	get canAutoClose() {
		delete this.canAutoClose;
		return this.canAutoClose = this.isOwnWindow || this.isPropsDialog;
	},
	get appInfo() {
		delete this.appInfo;
		return this.appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
			.getService(Components.interfaces.nsIXULAppInfo)
			.QueryInterface(Components.interfaces.nsIXULRuntime);
	},
	get platformVersion() {
		delete this.platformVersion;
		return this.platformVersion = parseFloat(this.appInfo.platformVersion);
	},

	instantInit: function() {
		window.addEventListener("load", this, false);
		this.isOwnWindow && this.wnd.instantInit();
	},
	init: function() {
		window.removeEventListener("load", this, false);
		window.addEventListener("unload", this, false);
		window.addEventListener("keypress", this, false);
		this.pu.init();
		this.showRows();
		this.setKeysDescDelay();

		this.initStyles();
		if(!this.isDownloadDialog)
			this.setRowHeight();

		if(this.isPropsDialog) {
			var showSep = false;
			for(
				var node = document.getElementById("linkPropsPlus-container").parentNode.nextSibling;
				node && node.nodeType == node.ELEMENT_NODE;
				node = node.nextSibling
			) {
				var bo = node.boxObject;
				if(bo.width > 0 && bo.height > 0) {
					showSep = true;
					break;
				}
			}
			document.getElementById("linkPropsPlus-separator").setAttribute("hidden", !showSep);

			var linkUrl = document.getElementById("link-url");
			if(linkUrl) {
				var sep = linkUrl.firstChild;
				if(sep && sep.localName == "separator")
					document.getElementById("linkPropsPlus-grid").style.marginLeft = sep.boxObject.width + "px";
			}
		}

		this.headers.init(this);
		this.initAutoClose();

		this.isOwnWindow && this.wnd.init();
		if(!this.isOwnWindow || this.wnd.autostart)
			this.getHeaders();
	},
	destroy: function() {
		window.removeEventListener("unload", this, false);
		window.removeEventListener("keypress", this, false);
		this.headers.destroy();
		this.destroyAutoClose();
		this.isOwnWindow && this.wnd.destroy();
		this.cancelCheckChannelResumable();
		if(!this.channel)
			return;
		this.channel.cancel(Components.results.NS_BINDING_ABORTED);
		this.channel = null;
	},
	handleEvent: function(e) {
		switch(e.type) {
			case "load":   this.init();    break;
			case "unload": this.destroy(); break;
			case "keypress":
				if("defaultPrevented" in e ? e.defaultPrevented : e.getPreventDefault())
					break;
				this.restartAutoClose();
				if(e.altKey || e.metaKey)
					break;
				if(e.keyCode == e.DOM_VK_RETURN && this.isOwnWindow) { // Enter, Ctrl+Enter or Shift+Enter pressed
					this.stopEvent(e);
					this.wnd.getHeaders(e);
				}
				else if(!e.shiftKey && !e.ctrlKey && e.keyCode == e.DOM_VK_ESCAPE) { // Escape pressed
					if(this.cancel())
						this.stopEvent(e);
					else if(this.blockEscapeKey) {
						this.blockEscapeKey = false; // Second press will close window anyway
						clearTimeout(this.blockEscapeKeyTimer);
						this.stopEvent(e);
					}
				}
			break;
			case "mouseover":
			case "mouseout":
				if(!e.relatedTarget)
					this[e.type == "mouseover" ? "windowOver" : "windowOut"]();
			break;
			case "mousemove":
				window.removeEventListener(e.type, this, false);
				this.windowOver();
			break;
			case "mouseup":
				// mousedown and "drag" anything outside the window
				// -> mouseout from window => windowOut()
				// -> move mouse => wrong mouseover => windowOver()
				if(e.target == document)
					this.windowOut();
		}
	},
	stopEvent: function(e) {
		e.preventDefault();
		e.stopPropagation();
	},
	setRowHeight: function() {
		var container = document.getElementById("linkPropsPlus-container");
		var tb = document.getElementById("linkPropsPlus-directURI");
		var btnSt1 = document.getElementById("linkPropsPlus-goToDirectURI").style;
		var btnSt2 = document.getElementById("linkPropsPlus-downloadDirectURI").style;
		var rowDirectURI = document.getElementById("linkPropsPlus-rowDirectURI");

		var hidden = container.getAttribute("hidden") == "true";
		hidden && container.removeAttribute("hidden");
		var rowHidden = rowDirectURI.getAttribute("hidden") == "true";
		rowHidden && rowDirectURI.removeAttribute("hidden");
		btnSt1.marginTop = btnSt2.marginTop = btnSt1.marginBottom = btnSt2.marginBottom = "";
		tb.removeAttribute("lpp_empty");
		tb.parentNode.removeAttribute("lpp_empty");

		var margin = document.getElementById("linkPropsPlus-rowSize").boxObject.height
			- document.getElementById("linkPropsPlus-rowDirectURI").boxObject.height;
		btnSt1.marginTop = btnSt2.marginTop = margin + "px";
		btnSt1.marginBottom = btnSt2.marginBottom = "-1px";

		var empty = !tb.value;
		tb.setAttribute("lpp_empty", empty);
		tb.parentNode.setAttribute("lpp_empty", empty);
		rowHidden && rowDirectURI.setAttribute("hidden", "true");
		hidden && container.setAttribute("hidden", "true");
	},
	initStyles: function() {
		var root = document.documentElement;
		var showButtons = this.isDownloadDialog ? 0 : this.pu.pref("showLinkButtons");
		root.setAttribute("linkPropsPlus_showButtons",       showButtons > 0);
		root.setAttribute("linkPropsPlus_showButtonsAlways", showButtons > 1);
		setTimeout(function() {
			var isDarkBG = false;
			var bg = window.getComputedStyle(root, null).backgroundColor;
			if(/^rgb\((\d+), *(\d+), *(\d+)\)$/.test(bg)) {
				var r = +RegExp.$1, g = +RegExp.$2, b = +RegExp.$3;
				var brightness = Math.max(r/255, g/255, b/255); // HSV, 0..1
				isDarkBG = brightness < 0.4;
			}
			root.setAttribute("linkPropsPlus_darkBackground", isDarkBG);
		}, 0);
	},
	showRows: function() {
		this.showRow("Status", "showResponseStatus");
		this.showRow("DirectURI", "showDirectURI");
		this.showRow("Headers", "showHttpHeaders");
	},
	showRow: function(rowId, pName) {
		var row = document.getElementById("linkPropsPlus-row" + rowId);
		if(
			this.isPropsDialog && this.pu.pref("properties." + pName)
			|| this.isDownloadDialog && this.pu.pref("download." + pName)
			|| this.isOwnWindow && this.pu.pref("ownWindow." + pName)
		)
			row.removeAttribute("hidden");
		else
			row.setAttribute("hidden", "true");
	},
	setKeysDescDelay: function() {
		setTimeout(function(_this) {
			_this.setKeysDesc();
		}, 0, this);
	},
	setKeysDesc: function() {
		var nodes = Array.slice(document.getElementsByAttribute("lpp_key", "*"));
		//~ hack: show fake hidden popup with <menuitem key="keyId" /> to get descriptions
		var mp = document.documentElement.appendChild(document.createElement("menupopup"));
		mp.style.visibility = "collapse";
		nodes.forEach(function(node) {
			var keyId = node.getAttribute("lpp_key");
			if(!keyId)
				return;
			var mi = document.createElement("menuitem");
			mi.__node = node;
			mi.setAttribute("key", keyId);
			mp.appendChild(mi);
		});
		mp._onpopupshown = function() {
			Array.forEach(
				this.childNodes,
				function(mi) {
					var keyDesk = mi.getAttribute("acceltext");
					if(!keyDesk)
						return;
					var node = mi.__node;
					node.tooltipText = node.tooltipText
						? node.tooltipText + " (" + keyDesk + ")"
						: keyDesk;
				}
			);
			this.parentNode.removeChild(this);
		};
		mp.setAttribute("onpopupshown", "this._onpopupshown();");
		mp["openPopup" in mp ? "openPopup" : "showPopup"]();
	},
	prefsChanged: function(pName) {
		if(
			pName == this.windowType + ".showResponseStatus"
			|| pName == this.windowType + ".showDirectURI"
			|| pName == this.windowType + ".showHttpHeaders"
		) {
			this.showRows();
			if(this.isOwnWindow) {
				// Unfortunately sizeToContent() works buggy with many flexible nodes
				window.resizeTo(window.outerWidth, 100); // This allows decrease height of window
				this.wnd.fixWindowHeight();
			}
			else {
				window.sizeToContent();
			}
		}
		else if(pName == "sizePrecision" || pName == "useBinaryPrefixes")
			this.convertSize();
		else if(pName == "decodeURIs") {
			this.formatURI();
			if(this.isOwnWindow)
				this.wnd.setTitle();
		}
		else if(pName == "testDownloadResumability") {
			if(this.testResumability)
				this.checkChannelResumable(this.channel);
		}
		else if(pName == "testDownloadResumability.download") {
			if(this.isDownloadDialog && this.testResumability)
				this.checkChannelResumable(this.channel);
		}
		else if(pName == "showLinkButtons")
			this.initStyles();
		else if(pName.substr(0, 10) == "autoClose.")
			this.reinitAutoClose();
	},
	getHeaders: function(clear, bypassCache, forceTestResumability) {
		if(clear)
			this.clearResults();
		if(this.request(bypassCache)) {
			document.getElementById("linkPropsPlus-container").removeAttribute("hidden");
			this.restartAutoClose();
			document.getElementById("linkPropsPlus-rowHeaders").setAttribute(
				"lpp_notAvailable",
				!(this.channel instanceof Components.interfaces.nsIHttpChannel)
			);
			if(forceTestResumability || this.testResumability) setTimeout(function(_this) {
				_this.checkChannelResumable(_this.channel);
			}, 0, this);
		}
	},
	clearResults: function() {
		Array.forEach(
			document.getElementById("linkPropsPlus-container").getElementsByTagName("textbox"),
			function(tb) {
				if(!tb.readOnly)
					return;
				tb.value = "";
				this.setMissingStyle(tb, false);
				tb.removeAttribute("tooltiptext");
				tb.setAttribute("lpp_empty", "true");
				tb.parentNode.setAttribute("lpp_empty", "true");
			},
			this
		);
		this.headers.clear();

		var grid = document.getElementById("linkPropsPlus-grid");
		grid.removeAttribute("lpp_canResumeDownload");
		grid.removeAttribute("lpp_resumeDownloadTested");
		var status = document.getElementById("linkPropsPlus-status");
		status.removeAttribute("lpp_canResumeDownload");
		status.removeAttribute("lpp_resumeDownloadTested");

		this.realCount = 0;
		this._lastSize = this._lastSizeTip = null;
		this.redirects.length = 0;
	},
	_contextNode: null,
	get contextNode() {
		return this._contextNode
			|| document.getElementById("linkPropsPlus-context").triggerNode
			|| document.popupNode;
	},
	initContextMenu: function(e) {
		if(!this._allowOptions)
			return false;
		var popup = e.currentTarget;
		var trg = this.contextNode;
		var row = this.getRowFromChild(trg);
		var tip = this.getTip(row);
		var copyTip = document.getElementById("linkPropsPlus-context-copyTip");
		copyTip.hidden = !tip;
		if(tip)
			copyTip.tooltipText = tip;
		else
			copyTip.removeAttribute("tooltiptext");

		var rowStatus = document.getElementById("linkPropsPlus-rowStatus");
		var testResume = document.getElementById("linkPropsPlus-context-testDownloadResumability");
		var testResumeSep = document.getElementById("linkPropsPlus-context-testDownloadResumabilitySeparator");
		var hideTestResume = testResume.hidden = testResumeSep.hidden =
			!this.pu.pref("testDownloadResumability.alwaysShowMenuItem")
			&& (this.testResumability || rowStatus.scrollHeight <= 0);
		if(!hideTestResume)
			testResume.disabled = !this.uri || this.checkResumableChannel;

		return true;
	},
	showContextMenu: function() {
		this._allowOptions = true;
		var fe = document.commandDispatcher.focusedElement;
		var row = this.getRowFromChild(fe);
		if(!row || row.parentNode.id != "linkPropsPlus-rows") {
			var rows = document.getElementById("linkPropsPlus-rows").childNodes;
			for(var i = 0, l = rows.length; i < l; ++i) {
				var r = rows[i];
				if(r.scrollHeight > 0) {
					row = r;
					break;
				}
			}
		}
		this._contextNode = row;
		var cm = document.getElementById("linkPropsPlus-context");
		if("openPopup" in cm)
			cm.openPopup(row, "after_start");
		else
			cm.showPopup(row, -1, -1, "popup", "bottomleft", "topleft");
	},
	openOptions: function(paneId) {
		var win = this.ut.wm.getMostRecentWindow("linkPropsPlus:optionsWindow");
		var showPane = paneId && function showPane(e) {
			e && win.removeEventListener(e.type, showPane, false);
			var doc = win.document;
			var pane = doc.getElementById(paneId);
			pane && doc.documentElement.showPane(pane);
		};
		if(win) {
			win.focus();
			if("linkPropsPlusOpts" in win)
				win.linkPropsPlusOpts.highlight(window);
			showPane && showPane();
			return;
		}
		win = window.openDialog(
			"chrome://linkpropsplus/content/options.xul",
			"_blank",
			"chrome,toolbar,titlebar,centerscreen"
		);
		showPane && win.addEventListener("load", showPane, false);
	},
	openOptionsClick: function(e) {
		var inLeftCol = this.isClickOnLeftCol(e);
		if(e.type == "mousedown")
			this._allowOptions = inLeftCol;
		else if(e.type == "click" && e.button == 1 && inLeftCol)
			this.openOptions();
		else if(e.type == "dblclick" && e.button == 0 && this._allowOptions)
			this.openOptions();
	},
	isClickOnLeftCol: function(e) {
		var col = document.getElementById("linkPropsPlus-columnLabels");
		var bo = col.boxObject;
		return e.screenX >= bo.screenX && e.screenX <= bo.screenX + bo.width
		    && e.screenY >= bo.screenY && e.screenY <= bo.screenY + bo.height;
	},
	getRowFromChild: function(node) {
		for(var row = node; row; row = row.parentNode)
			if(row.localName == "row")
				return row;
		return null;
	},
	copy: function(node) {
		var rows;
		if(node) {
			var row = this.getRowFromChild(node);
			if(row)
				rows = [row];
		}
		else {
			rows = Array.filter(
				document.getElementById("linkPropsPlus-rows").childNodes,
				function(row) {
					var bo = row.boxObject;
					return bo.width > 0 && bo.height > 0;
				}
			);
		}
		var lines = rows.map(function(row) {
			var field = this.getField(row);
			var data = field.value || this.getFrameText(field);
			return row.getElementsByTagName("label")[0].getAttribute("value")
				+ (data.indexOf("\n") == -1 ? " " : "\n") + data;
		}, this);
		this.copyString(lines.join("\n"));
	},
	getField: function(row) {
		return row.getElementsByTagName("textbox")[0]
			|| row.getElementsByTagName("iframe")[0];
	},
	getFrameText: function(frame) {
		var win = frame.contentWindow;
		var doc = win.document;
		// Note: doc.body.textContent doesn't contain newlines
		var sel = win.getSelection();
		var rng = doc.createRange();
		rng.selectNodeContents(doc.body);
		// Note: rng.toString() doesn't contain newlines
		// Save original selection
		var ranges = [];
		for(var i = 0, l = sel.rangeCount; i < l; ++i)
			ranges.push(sel.getRangeAt(i));
		sel.removeAllRanges();
		sel.addRange(rng);
		var data = sel.toString();
		// Restore original selection
		sel.removeAllRanges();
		ranges.forEach(function(rng) {
			sel.addRange(rng);
		});
		return data;
	},
	getTip: function(row) {
		return row && this.getField(row).tooltipText || "";
	},
	copyTip: function(node) {
		var tip = (this.getTip(this.getRowFromChild(node)) || "")
			.replace(/\s+$/mg, "");
		this.copyString(tip);
	},
	copyString: function(s) {
		s = s.replace(/\r\n?|\n/g, this.appInfo.OS == "WINNT" ? "\r\n" : "\n");
		Components.classes["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Components.interfaces.nsIClipboardHelper)
			.copyString(s, this.sourceDocument || document);
	},
	get parentWindow() {
		if(this.isOwnWindow)
			return this.wnd.parentWindow;
		if(
			this.isPropsDialog
			&& "nodeView" in window
			&& window.opener && this.ensureWindowOpened(opener)
			&& "gBrowser" in opener && opener.gBrowser
			&& "_getTabForContentWindow" in opener.gBrowser
		) {
			var tab = this._parentTab = opener.gBrowser._getTabForContentWindow(nodeView);
			return tab && tab.ownerDocument.defaultView;
		}
		return null;
	},
	_parentTab: null,
	get parentTab() {
		var tab = this.isOwnWindow ? this.wnd.parentTab : this._parentTab;
		if(tab && tab.parentNode && !tab.hidden && !tab.collapsed && !tab.closing)
			return tab;
		return null;
	},
	goToURI: function(textboxId, invertCloseBehavior) {
		var tb = document.getElementById("linkPropsPlus-" + textboxId);
		var uri = tb
			? tb.getAttribute("lpp_rawURI") || tb.value
			: this.uri;
		if(!uri)
			return;

		if(this.appInfo.name == "Thunderbird") {
			var mailWin = this.ut.wm.getMostRecentWindow("mail:3pane");
			if(mailWin) {
				mailWin.openLinkExternally(uri);
				this.closeWindow(invertCloseBehavior) && window.close();
				return;
			}
			mailWin = this.openInWindow("about:blank");
			var _this = this;
			var args = arguments;
			mailWin.addEventListener("load", function goToURI() {
				mailWin.removeEventListener("load", goToURI, false);
				_this.goToURI.apply(_this, args);
			}, false);
			return;
		}

		this.closeWindow(invertCloseBehavior) && window.close();

		var parentWindow = this.parentWindow;
		var browserWin = parentWindow
			&& parentWindow.document.documentElement.getAttribute("windowtype") == "navigator:browser"
			? parentWindow
			: this.ut.wm.getMostRecentWindow("navigator:browser");

		if(browserWin && "gBrowser" in browserWin) {
			browserWin.focus();
			var gBrowser = browserWin.gBrowser;

			if(
				browserWin == this.parentWindow
				&& this.parentTab
				&& this.pu.pref("openInChildTab")
			) {
				// Open a new tab as a child of the current tab (Tree Style Tab)
				// http://piro.sakura.ne.jp/xul/_treestyletab.html.en#api
				if("TreeStyleTabService" in browserWin)
					browserWin.TreeStyleTabService.readyToOpenChildTab(this.parentTab);

				// Tab Kit https://addons.mozilla.org/firefox/addon/tab-kit/
				// TabKit 2nd Edition https://addons.mozilla.org/firefox/addon/tabkit-2nd-edition/
				if("tabkit" in browserWin) {
					var hasTabKit = true;
					browserWin.tabkit.addingTab("related");
				}
			}

			if("privateTab" in browserWin)
				browserWin.privateTab.readyToOpenTab(this.isPrivate);
			gBrowser.selectedTab = gBrowser.addTab(uri, this.refererURI || undefined);

			hasTabKit && browserWin.tabkit.addingTabOver();
		}
		else {
			this.openInWindow(uri);
		}
	},
	saveLink: function(textboxId, invertCloseBehavior) {
		var tb = document.getElementById("linkPropsPlus-" + textboxId);
		var uri = tb
			? tb.getAttribute("lpp_rawURI") || tb.value
			: this.uri;
		if(!uri)
			return;
		if(tb) {
			if(tb.getAttribute("disabled") == "true")
				return;
			var delay = Math.max(300, this.pu.getPref("browser.download.saveLinkAsFilenameTimeout") || 0);
			tb.setAttribute("disabled", "true");
			setTimeout(function(tb) {
				tb.removeAttribute("disabled");
			}, delay, tb);
		}

		var browserWin = this.ut.wm.getMostRecentWindow("navigator:browser")
			|| this.ut.wm.getMostRecentWindow("mail:3pane");
		if(!browserWin) {
			browserWin = this.openInWindow("about:blank");
			var _this = this;
			var args = arguments;
			browserWin.addEventListener("load", function save() {
				browserWin.removeEventListener("load", save, false);
				_this.save(browserWin, uri);
			}, false);
			return;
		}
		this.closeWindow(invertCloseBehavior) && window.close();
		this.save(browserWin, uri);
	},
	save: function(browserWin, uri) {
		// Hack: we use nsContextMenu.saveLink() from chrome://browser/content/nsContextMenu.js
		// to get correct name (see http://kb.mozillazine.org/Browser.download.saveLinkAsFilenameTimeout)
		var browserDoc = browserWin.document;
		var content = this.sourceWindow || browserWin.content;
		var contentDoc = content.document;
		var link = contentDoc.createElementNS("http://www.w3.org/1999/xhtml", "a");
		link.href = uri;
		var fakeDoc = {
			nodePrincipal: contentDoc.nodePrincipal,
			documentURI: this.referer,
			documentURIObject: this.refererURI || null,
			defaultView: content,
			__proto__: contentDoc
		};
		browserDoc.popupNode = link;
		try {
			link = link.wrappedJSObject || link;
			Object.__defineGetter__.call(link, "ownerDocument", function() {
				return fakeDoc;
			});
			new browserWin.nsContextMenu(
				browserDoc.getElementById("contentAreaContextMenu")
					|| browserDoc.getElementById("mailContext"),
				browserWin.gBrowser
			).saveLink();
		}
		catch(e) {
			this.ut.error("new nsContextMenu( ... ).saveLink() failed");
			Components.utils.reportError(e);
			try {
				// See chrome://global/content/contentAreaUtils.js
				// "aSourceDocument" argument is only for nsILoadContext.usePrivateBrowsing for now
				browserWin.saveURL(uri, null, null, true, false, this.refererURI, contentDoc);
			}
			catch(e2) {
				this.ut.error("saveURL() failed");
				Components.utils.reportError(e2);
			}
		}
		browserDoc.popupNode = null;
	},
	openInWindow: function(uri) {
		return window.openDialog(
			this.pu.getPref("browser.chromeURL") || (
				this.appInfo.name == "Thunderbird"
					? "chrome://messenger/content/"
					: "chrome://browser/content/"
			),
			"_blank",
			"chrome,all,dialog=no",
			uri,
			null,
			this.refererURI || null,
			null,
			false
		);
	},
	closeWindow: function(invertCloseBehavior) {
		var close = this.pu.pref("closeAfterOpen");
		if(typeof invertCloseBehavior == "object") {
			var e = invertCloseBehavior;
			invertCloseBehavior = e.ctrlKey || e.shiftKey || e.altKey || e.metaKey;
		}
		if(invertCloseBehavior)
			close = !close;
		return close;
	},

	request: function(bypassCache) {
		var _uri = this.requestURI = this.uri;
		if(!_uri)
			return false;

		this._lastSize = this._lastSizeTip = null;
		this._hasSize = this._hasType = false;
		delete this._isPrivateOverrided;

		if(this.isDownloadDialog) {
			var dl = dialog.mLauncher;
			if("contentLength" in dl && dl.contentLength) // https://bugzilla.mozilla.org/show_bug.cgi?id=455913
				this.formatSize(dl.contentLength);
			if("MIMEInfo" in dl) {
				var mi = dl.MIMEInfo;
				if("MIMEType" in mi && mi.MIMEType)
					this.formatType(mi.MIMEType);
				else if("type" in mi && mi.type)
					this.formatType(mi.type);
			}
		}

		try {
			_uri = this.checkFakeURINeeded(_uri);
			this.requestedURI = _uri;

			//var uri = Components.classes["@mozilla.org/network/standard-url;1"]
			//	.createInstance(Components.interfaces.nsIURI);
			//uri.spec = _uri;
			var uri = this.ios.newURI(_uri, null, null); //~ todo: specify charset ?
			var schm = uri.scheme && uri.scheme.toLowerCase();

			var ph = Components.interfaces.nsIProtocolHandler;
			if("URI_DOES_NOT_RETURN_DATA" in ph) { // Firefox 3
				var flags = this.ios.getProtocolFlags(schm);
				if(flags & ph.URI_DOES_NOT_RETURN_DATA) {
					this.ut.warning('URI_DOES_NOT_RETURN_DATA (scheme: "' + schm + '")');
					this.onStopRequestCallback(false);
					return false;
				}
			}

			if(this.channel)
				this.channel.cancel(Components.results.NS_BINDING_ABORTED);
			this.cancelCheckChannelResumable();

			var ch = this.channel = this.newChannelFromURI(uri, bypassCache);
			ch.notificationCallbacks = this; // Detect redirects
			// => getInterface() => asyncOnChannelRedirect()

			if(ch instanceof Components.interfaces.nsIHttpChannel) {
				ch.requestMethod = "HEAD";
				if(this.pu.pref("showCaptionsInHttpHeaders"))
					this.headers.caption(this.ut.getLocalized("request"));
				this.headers.beginSection();
				ch.visitRequestHeaders(this);
				this.headers.endSection();
			}

			try {
				ch.asyncOpen(this, null);
				this.requestHash = this.getRequestHash(ch);
				return this.activeRequest = true;
			}
			catch(e2) {
				Components.utils.reportError(e2);
			}
			this.onStopRequestCallback(false);
			return false;
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		this.onStopRequestCallback(false);
		return false;
	},
	checkFakeURINeeded: function(uri) {
		// Ugly workaround...
		// Request will be sended after downloading file from "_uri" to %temp%.
		// Following works for me in some tests, but it is very bad hack.
		if(
			this.isDownloadDialog
			&& (this.platformVersion < 2 || this.pu.pref("download.forceFakeURIHack")) //~ todo: test!
		)
			uri += "?" + Math.random().toFixed(16).substr(2) + Math.random().toFixed(16).substr(2);
		return uri;
	},
	newChannelFromURI: function(uri, bypassCache) {
		var ch = uri.scheme == "about" && "nsIAboutModule" in Components.interfaces
			? Components.classes["@mozilla.org/network/protocol/about;1?what=" + uri.path.replace(/[?&#].*$/, "")]
				.getService(Components.interfaces.nsIAboutModule)
				.newChannel(uri)
			: this.ios.newChannelFromURI(uri);

		if(ch instanceof Components.interfaces.nsIRequest) try {
			ch.loadFlags |= ch.LOAD_BACKGROUND | ch.INHIBIT_CACHING;
			if(bypassCache)
				ch.loadFlags |= ch.LOAD_BYPASS_CACHE;
		}
		catch(e) {
			Components.utils.reportError(e);
		}

		if(
			"nsIPrivateBrowsingChannel" in Components.interfaces
			&& ch instanceof Components.interfaces.nsIPrivateBrowsingChannel
			&& "setPrivate" in ch
			&& this.isPrivate
		)
			ch.setPrivate(true);

		if(ch instanceof Components.interfaces.nsIHttpChannel) {
			var ref = this.isOwnWindow ? this.realReferer : this.referer;
			ref && ch.setRequestHeader("Referer", ref, false);
		}

		ch instanceof Components.interfaces.nsIFTPChannel;
		return ch;
	},
	getRequestHash: function(ch) {
		var hash = ch.originalURI.spec;
		if(ch instanceof Components.interfaces.nsIHttpChannel) try {
			hash += "\n" + ch.getRequestHeader("Referer");
		}
		catch(e) {
		}
		return hash;
	},

	// Autoclose feature
	_acTimeout: 0,
	_acProgressInterval: 0,
	autoCloseInitialized: false,
	autoCloseActive: false,
	initAutoClose: function() {
		if(!this.canAutoClose)
			return;
		if(!this.requestFinished && this.pu.pref("autoClose.onlyAfterRequest"))
			return;

		if(this.autoCloseInitialized)
			return;
		this.autoCloseInitialized = true;

		var dur = this._acDelay = this.pu.pref("autoClose.delay") || 0;
		if(dur < 1000 || !this.pu.pref("autoClose.enabled"))
			return;
		this.delayedClose();
		if(this.pu.pref("autoClose.dontCloseUnderCursor"))
			this.setDontClose(true);
	},
	destroyAutoClose: function(restart) {
		if(!this.autoCloseInitialized)
			return;
		this.autoCloseInitialized = false;

		this.setDontClose(false);
		this.progress.hidden = true;
		if(restart)
			this.cancelDelayedClose();
	},
	restartAutoClose: function() {
		if(!this.autoCloseActive)
			return;
		this.cancelDelayedClose();
		this.delayedClose();
	},
	reinitAutoClose: function() {
		this.destroyAutoClose(true);
		this.initAutoClose();
	},
	setDontClose: function(enable) {
		var action = enable ? window.addEventListener : window.removeEventListener;
		action.call(window, "mouseover", this, false);
		action.call(window, "mouseout",  this, false);
		action.call(window, "mousemove", this, false);
		action.call(window, "mouseup",   this, true);
		this._windowOver = false;
		document.documentElement.removeAttribute("lpp_hover");
	},
	_windowOver: false,
	windowOver: function() {
		if(this._windowOver)
			return;
		this._windowOver = true;
		document.documentElement.setAttribute("lpp_hover", "true");
		this.cancelDelayedClose();
	},
	windowOut: function() {
		if(!this._windowOver)
			return;
		this._windowOver = false;
		document.documentElement.setAttribute("lpp_hover", "false");
		this.delayedClose();
	},
	delayedClose: function() {
		this.autoCloseActive = true;
		this._acTimeout = setTimeout(window.close, this._acDelay);
		this._acStartTime = Date.now();
		this.progress.value = 0;
		this.progress.hidden = false;
		this.progress.max = this._acPrecision = this.progress.boxObject.width * 4 || 500;
		var _this = this;
		this._acProgressInterval = setInterval(
			function() {
				_this.setProgress();
			},
			Math.round(this._acDelay/this._acPrecision) + 4
		);
	},
	cancelDelayedClose: function() {
		this.autoCloseActive = false;
		clearTimeout(this._acTimeout);
		clearInterval(this._acProgressInterval);
		this.progress.value = 0;
		//this.progress.hidden = true;
	},
	get progress() {
		var progressBlock = document.getElementById("linkPropsPlus-autocloseProgressBlock");
		var root = document.documentElement;
		progressBlock.setAttribute("chromedir", window.getComputedStyle(root, null).direction);
		root.appendChild(progressBlock); // #linkPropsPlus-container can be hidden!
		var progress = document.getElementById("linkPropsPlus-autocloseProgress");
		if(!("max" in progress)) { // Firefox < 3.5
			progress._gain = 1;
			progress.__defineGetter__("max", function() {
				return Math.round(this.getAttribute("max") * this._gain);
			});
			progress.__defineSetter__("max", function(max) {
				this._gain = max/100;
				this.setAttribute("max", 100);
			});
			progress.__defineGetter__("value", function() {
				return Math.round(this.getAttribute("value") * this._gain);
			});
			progress.__defineSetter__("value", function(value) {
				this.setAttribute("value", Math.round(value/this._gain));
			});
		}
		delete this.progress;
		return this.progress = progress;
	},
	setProgress: function() {
		var persent = (Date.now() - this._acStartTime)/this._acDelay;
		if(persent >= 1) {
			clearInterval(this._acProgressInterval);
			return;
		}
		this.progress.value = Math.round(this._acPrecision * persent);
	},

	_uri: null,
	get uri() {
		if(this.isOwnWindow)
			return document.getElementById("linkPropsPlus-uri").value;
		if(this.isPropsDialog)
			return document.getElementById("link-url-text").value;

		// Based on code of FlashGot extension https://addons.mozilla.org/addon/flashgot/
		// chrome://flashgot/content/flashgotDMOverlay.js
		return this._uri = dialog.mLauncher.source.spec;
	},
	get realReferer() {
		if(this.isPropsDialog)
			return window.arguments[0].ownerDocument.defaultView.location.href;
		if(this.isOwnWindow)
			return this.wnd.referer;
		var err;
		try {
			return dialog.mContext
				.QueryInterface(Components.interfaces.nsIWebNavigation)
				.currentURI.spec;
		}
		catch(e) {
			err = e;
		}
		var sourceDoc = this.sourceDocument;
		var ref = sourceDoc && sourceDoc.documentURI;
		if(ref)
			return ref;
		Components.utils.reportError(err);
		return this._uri;
	},
	get referer() {
		return this.checkReferer(this.realReferer, this.uri);
	},
	get refererURI() {
		try {
			return this.ios.newURI(this.referer, null, null);
		}
		catch(e) {
		}
		return undefined;
	},
	get sendReferer() {
		return this.pu.getPref("network.http.sendRefererHeader", 2) > 1;
	},
	isValidReferer: function(s) {
		return s && this.validReferer.test(s);
	},
	checkReferer: function(referer, uri) {
		if(!this.sendReferer) {
			if(!this.pu.pref("useFakeReferer.force"))
				return undefined;
			referer = ""; // Make it "invalid"
		}
		if(this.isValidReferer(referer))
			return referer;
		switch(this.pu.pref("useFakeReferer")) {
			case 1:
				try {
					var uriObj = this.ios.newURI(uri, null, null);
					// Thanks to RefControl https://addons.mozilla.org/firefox/addon/refcontrol/
					referer = uriObj.scheme + "://" + uriObj.hostPort + "/";
					break;
				}
				catch(e) { // Will use "uri" as referer
				}
			case 2:
				referer = uri;
		}
		if(this.isValidReferer(referer))
			return referer;
		return undefined;
	},
	compareURIs: function(uri, uri2) {
		try {
			return this.ios.newURI(uri, null, null)
				.equals(this.ios.newURI(uri2, null, null));
		}
		catch(e) {
		}
		return uri == uri2;
	},
	get sourceDocument() {
		var win = this.sourceWindow;
		return win && win.document || null;
	},
	get sourceWindow() {
		return this.ensureWindowOpened(this._sourceWindow);
	},
	get _sourceWindow() {
		if(this.isPropsDialog)
			return window.arguments[0].ownerDocument.defaultView;
		if(this.isOwnWindow)
			return this.wnd.sourceWindow;

		// Based on code of FlashGot extension https://addons.mozilla.org/addon/flashgot/
		// chrome://flashgot/content/flashgotDMOverlay.js
		try {
			return dialog.mContext
				.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
				.getInterface(Components.interfaces.nsIDOMWindow);
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		return top.opener && top.opener.content || null;
	},
	ensureWindowOpened: function(win) {
		try {
			if(win && !win.closed)
				return win;
		}
		catch(e) { // TypeError: can't access dead object
		}
		return null;
	},
	_isPrivate: false,
	get isPrivate() {
		if("_isPrivateOverrided" in this)
			return this._isPrivateOverrided;
		var sourceWindow = this.sourceWindow;
		if(!sourceWindow) // Already closed? Will use cached value
			return this._isPrivate;
		return this._isPrivate = this.ut.isWindowPrivate(sourceWindow);
	},

	headers: {
		parent: null,
		init: function(parent) {
			this.parent = parent;
			// We should do this here to avoid strange bugs with window autosizing
			// after setRowHeight() in Firefox 3.6
			this.frame.setAttribute("transparent", "true");
		},
		destroy: function() {
			this.parent = null;
		},
		get colon() {
			delete this.colon;
			return this.colon = this.parent.ut.getLocalized("colon").slice(1, -1) || ": ";
		},
		get frame() {
			delete this.frame;
			return this.frame = document.getElementById("linkPropsPlus-headers");
		},
		get field() {
			delete this.field;
			return this.field = this.frame.contentDocument.body;
		},
		clear: function() {
			this.field.textContent = "";
		},
		caption: function(s) {
			var h = this._appendNode("h1", "caption", s);
			var prev = h.previousSibling;
			if(prev)
				this.spacer(h);
		},
		spacer: function(insPos) {
			var spacer = this._node("div", "spacer");
			spacer.appendChild(this._node("br", "copyHack"));
			if(insPos)
				insPos.parentNode.insertBefore(spacer, insPos);
			else {
				var section = this._activeSection || this.field;
				section.appendChild(spacer);
			}
			return spacer;
		},
		entry: function(name, value) {
			this.beginSection("entry");
			this._appendNode("strong", "name", name);
			this._appendNode("span", "colon", this.colon);
			this._appendNode("span", "value", value);
			this.endSection();
		},
		rawData: function(s) {
			//~ todo: split using <br>
			this._appendNode("div", "rawData", s);
		},
		_sections: [],
		_activeSection: null,
		beginSection: function(nodeClass) {
			this._sections.push(this._activeSection = this._appendNode("div", nodeClass || "block"));
			var prev = this._activeSection.previousSibling;
			if(prev && prev.className != "spacer")
				prev.appendChild(this._node("br", "copyHack"));
		},
		endSection: function() {
			var sections = this._sections;
			sections.pop();
			this._activeSection = sections[sections.length - 1] || null;
		},
		_appendNode: function(nodeName, nodeClass, nodeText) {
			return this._append(this._node.apply(this, arguments));
		},
		_node: function(nodeName, nodeClass, nodeText, noAppend) {
			var node = document.createElementNS("http://www.w3.org/1999/xhtml", nodeName);
			node.className = nodeClass;
			if(nodeText)
				node.appendChild(document.createTextNode(nodeText));
			return node;
		},
		_append: function(node) {
			var section = this._activeSection || this.field;
			return section.appendChild(node);
		}
	},

	_responseHeaders: { __proto__: null },
	// nsIHttpHeaderVisitor
	visitHeader: function(header, value) {
		this.headers.entry(header, value);
		this._responseHeaders[header] = value;
		switch(header) {
			case "Content-Length": this.formatSize(value); break;
			case "Last-Modified":  this.formatDate(value); break;
			case "Content-Type":   this.formatType(value);
		}
	},

	formatSize: function(rawSize) {
		var textSize = this.getSizeStr(rawSize);
		if(!textSize)
			return;
		var target = document.getElementById("linkPropsPlus-size");
		if(this._hasSize) {
			if(textSize != target.value) {
				this._lastSizeTip = rawSize;
				target.setAttribute("tooltiptext", textSize);
			}
		}
		else {
			this._hasSize = true;
			this._lastSize = rawSize;
			this.setMissingStyle(target, false);
			target.value = textSize;
			if(!this._hasSize)
				target.removeAttribute("tooltiptext");
		}
	},
	convertSize: function() {
		var target = document.getElementById("linkPropsPlus-size");
		if(this._lastSize !== null)
			target.value = this.getSizeStr(this._lastSize);
		if(this._lastSizeTip !== null)
			target.setAttribute("tooltiptext", this.getSizeStr(this._lastSizeTip));
	},
	getSizeStr: function(rawSize) {
		var intSize = parseInt(rawSize);
		if(intSize < 0) // We get -1 for FTP directories
			return "";
		var size = this.formatNumStr(String(rawSize));

		var useBinaryPrefixes = this.pu.pref("useBinaryPrefixes");
		var k = useBinaryPrefixes ? 1024 : 1000;
		var type, g;
		if     (intSize > k*k*k*k) type = "terabytes", g = k*k*k*k;
		else if(intSize > k*k*k)   type = "gigabytes", g = k*k*k;
		else if(intSize > k*k)     type = "megabytes", g = k*k;
		else if(intSize > k/2)     type = "kilobytes", g = k;

		if(type && useBinaryPrefixes)
			type = type.replace(/^(..)../, "$1bi");

		return type
			? this.ut.getLocalized(type, [this.formatNum(intSize/g), size])
			: this.ut.getLocalized("bytes", [size]);
	},
	initLocaleNumbers: function() {
		// Detect locale delimiter (e.g. 0.1 -> 0,1)
		if(/(\D+)\d+\D*$/.test((1.1).toLocaleString()))
			var ld = RegExp.$1;
		// Detect locale separator (e.g. 123456 -> 123 456 or 123,456)
		if(/^\D*\d+(\D+)/.test((1234567890123).toLocaleString()))
			var ls = RegExp.$1;
		delete this.localeDelimiter;
		delete this.localeSeparator;
		this.localeDelimiter = ld && ls ? ld : ".";
		this.localeSeparator = ld && ls ? ls : "\xa0";
	},
	get localeDelimiter() {
		this.initLocaleNumbers();
		return this.localeDelimiter;
	},
	get localeSeparator() {
		this.initLocaleNumbers();
		return this.localeSeparator;
	},
	formatNum: function(n) {
		return this.formatNumStr(
			n.toFixed(this.pu.pref("sizePrecision") || 0)
				.replace(/\./, this.localeDelimiter)
		);
	},
	formatNumStr: function(s) {
		return s.replace(/(\d)(?=(?:\d{3})+(?:\D|$))/g, "$1" + this.localeSeparator); // 12345678 -> 12 345 678
	},
	formatDate: function(str) {
		var target = document.getElementById("linkPropsPlus-lastModified");
		var date = new Date(str);
		var isInvalid = !str || !isFinite(date.getTime());
		this.setMissingStyle(target, isInvalid);
		if(str && isInvalid)
			target.tooltipText = str;
		target.value = date.toLocaleString();
	},
	formatType: function(str) {
		var target = document.getElementById("linkPropsPlus-contentType");
		if(this._hasType) {
			if(str != target.value)
				target.setAttribute("tooltiptext", str);
		}
		else {
			this._hasType = true;
			this.setMissingStyle(target, !str);
			target.value = str;
			target.removeAttribute("tooltiptext");
		}
	},
	formatStatus: function(status, statusText, canResumeDownload, isTested) {
		var tb = document.getElementById("linkPropsPlus-status");
		tb.value = status + (statusText ? " " + statusText : "");
		this.setMissingStyle(tb, status >= 400 && status < 600);
		this.formatCanResumeDownload(canResumeDownload, isTested, tb);
	},
	formatCanResumeDownload: function(canResumeDownload, isTested, tb) {
		if(!tb)
			tb = document.getElementById("linkPropsPlus-status");
		// We use clearResults() and may receive "tested" value before "non-tested"
		if(!isTested && tb.getAttribute("lpp_resumeDownloadTested") == "true")
			return;
		var grid = document.getElementById("linkPropsPlus-grid"); // May be used in userChrome.css
		grid.setAttribute("lpp_canResumeDownload", canResumeDownload);
		grid.setAttribute("lpp_resumeDownloadTested", !!isTested);
		tb.setAttribute("lpp_canResumeDownload", canResumeDownload);
		tb.setAttribute("lpp_resumeDownloadTested", !!isTested);
		if(canResumeDownload == "probably")
			tb.tooltipText = this.ut.getLocalized("probablyCanResumeDownload");
		else if(canResumeDownload) {
			tb.tooltipText = this.ut.getLocalized("canResumeDownload")
				+ (isTested ? " \n" + this.ut.getLocalized("resumeSuccessfullyTested") : "");
		}
		else {
			tb.tooltipText = this.ut.getLocalized("cantResumeDownload")
				+ (isTested ? " \n" + this.ut.getLocalized("resumeTested") : "");
		}
	},
	formatURI: function(uri) {
		var tb = document.getElementById("linkPropsPlus-directURI");
		if(uri == this.requestedURI) // Hide ?ramdom hack
			uri = this.requestURI;
		if(arguments.length == 0)
			uri = tb.getAttribute("lpp_rawURI") || "";
		else
			tb.setAttribute("lpp_rawURI", uri);
		tb.value = this.ut.decodeURI(uri);
		var empty = !uri;
		tb.setAttribute("lpp_empty", empty);
		tb.parentNode.setAttribute("lpp_empty", empty);
		this.setMissingStyle(tb, this.compareURIs(uri, this.requestURI));

		var redirects = this.redirects;
		if(!redirects.length)
			tb.removeAttribute("tooltiptext");
		else {
			var header = this.ut.getLocalized("redirectsHeader", [redirects.length - 1]) + " \n";
			tb.tooltipText = header + redirects.map(function(redirect, i) {
				var uri = redirect.uri;
				if(i == 0) {
					if(uri == this.requestedURI) // Hide ?ramdom hack
						uri = this.requestURI;
					return this.ut.decodeURI(uri);
				}
				var types = [];
				var flags = redirect.flags;
				var ces = Components.interfaces.nsIChannelEventSink;
				if(flags & ces.REDIRECT_TEMPORARY)
					types.push(this.ut.getLocalized("temporary"));
				if(flags & ces.REDIRECT_PERMANENT)
					types.push(this.ut.getLocalized("permanent"));
				if(flags & ces.REDIRECT_INTERNAL)
					types.push(this.ut.getLocalized("internal"));
				var type = types.join(this.ut.getLocalized("separator").slice(1, -1));
				return this.ut.getLocalized("redirectInfo", [type, this.ut.decodeURI(uri)]);
			}, this).join(" \n");
		}
	},

	fillInBlank: function() {
		var target = document.getElementById("linkPropsPlus-size");
		var missing = this.ut.getLocalized("missing");
		if(!target.value) {
		/*
			try {
				this.channel.QueryInterface(Components.interfaces.nsICachingChannel);
				if(this.channel.isFromCache())
					alert(this.channel);
			} catch(e) { alert(e) }
		*/
			this.setMissingStatus(target, missing);
		}

		target = document.getElementById("linkPropsPlus-contentType");
		if(!target.value)
			this.setMissingStatus(target, missing);

		target = document.getElementById("linkPropsPlus-lastModified");
		if(!target.value)
			this.setMissingStatus(target, missing);

		target = document.getElementById("linkPropsPlus-status");
		if(!target.value)
			this.setMissingStatus(target, missing);
	},
	setMissingStatus: function(target, text) {
		target.value = text;
		this.setMissingStyle(target, true);
	},
	setMissingStyle: function(target, isMissing) {
		target.setAttribute("lpp_missing", isMissing);
		target.parentNode.setAttribute("lpp_missing", isMissing);
	},

	Components: Components, // We can receive nsIChannel notifications after window will be closed
	// And in Firefox <= 3.6 garbage collector may already remove Components from scope
	// nsIStreamListener
	onDataAvailable: function(request, ctxt, input, offset, count) {
		var data = this.getStreamData(input, count);
		request.cancel(this.Components.results.NS_BINDING_ABORTED);
		if(window.closed)
			return;
		if(request.URI && request.URI.scheme == "data")
			return;
		this.realCount += count;
		var maxLen = 2e3;
		//~ todo: add special caption ?
		this.headers.rawData(data.substr(0, maxLen) + (data.length > maxLen ? "\n[\u2026]" : ""));
	},
	getStreamData: function(inputStream, count) {
		try {
			var bInput = Components.classes["@mozilla.org/binaryinputstream;1"]
				.createInstance(Components.interfaces.nsIBinaryInputStream);
			bInput.setInputStream(inputStream);
			return bInput.readBytes(count);
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		return "";
	},
	// nsIRequestObserver
	onStartRequest: function(request, ctxt) {
		var ch = this.channel;
		if(!ch)
			return; // Window is closed
		try {
			if(request instanceof Components.interfaces.nsIHttpChannel) {
				if(this.pu.pref("showCaptionsInHttpHeaders"))
					this.headers.caption(this.ut.getLocalized("response"));
				else
					this.headers.spacer();
				this.headers.beginSection();
				this.headers.entry("Status", request.responseStatus + " " + request.responseStatusText);
				var headers = this._responseHeaders = { __proto__: null };
				request.visitResponseHeaders(this);
				this._responseHeaders = { __proto__: null };
				this.headers.endSection();
				if(
					"X-Archive-Orig-Last-Modified" in headers // Used on http://archive.org/
					&& !("Last-Modified" in headers) // We prefer Last-Modified, if available
				)
					this.formatDate(headers["X-Archive-Orig-Last-Modified"]);
				var canResumeDownload = request instanceof Components.interfaces.nsIResumableChannel
					&& "Accept-Ranges" in headers
					&& headers["Accept-Ranges"] == "bytes"
					&& "Content-Length" in headers
					&& headers["Content-Length"] > 0;
				this.formatStatus(request.responseStatus, request.responseStatusText, canResumeDownload);
			}
			else {
				var canResumeDownload = request instanceof Components.interfaces.nsIResumableChannel
					? "probably"
					: false;
				var status = "responseStatus" in request && request.responseStatus || "";
				var statusText = "responseStatusText" in request && request.responseStatusText || "";
				this.formatStatus(status, statusText, canResumeDownload);
				if("contentType" in ch)
					this.formatType(ch.contentType);
				if("contentLength" in ch)
					this.formatSize(ch.contentLength);
				if("lastModifiedTime" in request && request.lastModifiedTime) { // Firefox 4
					var t = request.lastModifiedTime;
					this.formatDate(t > 1e14 ? t/1000 : t);
				}
			}
		}
		catch(err) {
			this.ut.error("Can't get information from request");
			Components.utils.reportError(err);
		}
		finally {
			request.cancel(Components.results.NS_BINDING_ABORTED);
			this.fillInBlank();
			this.channel = null;
		}
	},
	onStopRequest: function(request, ctxt, status) {
		this.activeRequest = false;
		if(window.closed)
			return;
		if(!this.cancelling) {
			this.blockEscapeKey = true;
			clearTimeout(this.blockEscapeKeyTimer);
			this.blockEscapeKeyTimer = setTimeout(function(_this) {
				_this.blockEscapeKey = false;
			}, this.blockEscapeKeyDelay, this);
		}
		if(this.realCount > 0)
			this.formatSize(this.realCount.toString());
		if(request instanceof Components.interfaces.nsIChannel && request.URI)
			this.formatURI(request.URI.spec);
		//if(this.testResumability)
		//	this.checkChannelResumable(request);

		this.onStopRequestCallback(true);
	},

	checkResumableChannel: null,
	checkChannelResumable: function(origChannel) {
		this.cancelCheckChannelResumable();
		if(origChannel) {
			if(!(origChannel instanceof Components.interfaces.nsIResumableChannel)) {
				this.formatCanResumeDownload(false, true);
				return;
			}
			var uri = origChannel.originalURI;
		}
		else {
			var _uri = this.checkFakeURINeeded(this.uri);
			var uri = this.ios.newURI(_uri, null, null);
		}
		var ch = this.newChannelFromURI(uri);
		if(!origChannel && this.getRequestHash(ch) != this.requestHash) {
			this.getHeaders(true, false, true);
			return;
		}
		if(!(ch instanceof Components.interfaces.nsIResumableChannel)) {
			this.formatCanResumeDownload(false, true);
			return;
		}
		var testResume = document.getElementById("linkPropsPlus-context-testDownloadResumability");
		testResume.disabled = true;
		this.checkResumableChannel = ch;
		if(ch instanceof Components.interfaces.nsIHttpChannel)
			ch.setRequestHeader("Range", "bytes=1-32", false);
		ch.resumeAt(1, "");
		var showHeaders = this.pu.pref("testDownloadResumability.showHttpHeaders");
		if(showHeaders && ch instanceof Components.interfaces.nsIHttpChannel) try {
			this.headers.caption(this.ut.getLocalized("testResumabilityRequest"));
			this.headers.beginSection();
			ch.visitRequestHeaders(this);
			this.headers.endSection();
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		ch.asyncOpen({
			parent: this,
			done: false,
			get canceled() {
				return !this.parent.checkResumableChannel || window.closed;
			},
			setCanResumeDownload: function(canResumeDownload) {
				if(this.done || this.canceled)
					return;
				this.done = true;
				this.parent.formatCanResumeDownload(canResumeDownload, true);
			},
			// nsIStreamListener
			onDataAvailable: function(request, ctxt, input, offset, count) {
				var data = this.parent.getStreamData(input, count);
				request.cancel(this.parent.Components.results.NS_BINDING_ABORTED);
				this.setCanResumeDownload(!!data);
			},
			// nsIRequestObserver
			onStartRequest: function(request, ctxt) {},
			onStopRequest: function(request, ctxt, status) {
				if(!this.canceled && showHeaders && request instanceof Components.interfaces.nsIHttpChannel) try {
					var headers = this.parent.headers;
					headers.caption(this.parent.ut.getLocalized("testResumabilityResponse"));
					headers.beginSection();
					headers.entry("Status", request.responseStatus + " " + request.responseStatusText);
					request.visitResponseHeaders(this.parent);
					headers.endSection();
				}
				catch(e) {
					Components.utils.reportError(e);
				}
				this.setCanResumeDownload(false);
				testResume.disabled = false;
				this.parent.checkResumableChannel = null;
			}
		}, null);
	},
	cancelCheckChannelResumable: function() {
		var crCh = this.checkResumableChannel;
		if(crCh) {
			this.checkResumableChannel = null;
			crCh.cancel(Components.results.NS_BINDING_ABORTED);
		}
	},
	onStopRequestCallback: function(ok) {
		this.requestFinished = true;
		if(this.isOwnWindow)
			this.wnd.onStopRequest(ok);
		this.initAutoClose();
	},

	// nsIInterfaceRequestor
	getInterface: function(iid) {
		if(
			iid.equals(Components.interfaces.nsIChannelEventSink)
			|| iid.equals(Components.interfaces.nsILoadContext) // Hack for Private Tab extension
				&& "@mozilla.org/network/protocol;1?name=private" in Components.classes
				&& new Error().stack.indexOf("@chrome://privatetab/content/protocol.js:") != -1
		)
			return this;
		throw Components.results.NS_ERROR_NO_INTERFACE;
	},
	// nsIChannelEventSink
	onChannelRedirect: function(oldChannel, newChannel, flags) { // Gecko < 2
		this.onRedirect.apply(this, arguments);
	},
	asyncOnChannelRedirect: function(oldChannel, newChannel, flags, callback) {
		callback.onRedirectVerifyCallback(Components.results.NS_OK); // Allow redirect
		this.onRedirect.apply(this, arguments);
	},
	onRedirect: function(oldChannel, newChannel, flags) {
		var redirects = this.redirects;
		if(!redirects.length)
			redirects.push({ uri: oldChannel.URI.spec });
		redirects.push({ uri: newChannel.URI.spec, flags: flags });
	},
	// nsILoadContext (fake, only for Private Tab extension)
	get usePrivateBrowsing() {
		return this.isPrivate;
	},
	set usePrivateBrowsing(isPrivate) {
		this._isPrivateOverrided = isPrivate;
		if(this.isOwnWindow)
			this.wnd.setTitle();
	},

	cancelling: false,
	cancellingTimer: 0,
	cancel: function() {
		if(this.activeRequest && this.channel) {
			// Allow press Escape twice to cancel request and close window
			this.cancelling = true;
			clearTimeout(this.cancellingTimer);
			this.cancellingTimer = setTimeout(function(_this) {
				_this.cancelling = false;
			}, this.blockEscapeKeyDelay, this);

			this.channel.cancel(Components.results.NS_BINDING_ABORTED);
			this.fillInBlank();
			//if(this.channel instanceof Components.interfaces.nsIFTPChannel)
			this.onStopRequest(this.channel);
			this.channel = null;
			return true;
		}
		this.cancelCheckChannelResumable();
		return false;
	}
};
linkPropsPlusSvc.instantInit();