var linkPropsPlusDND = {
	get lpp() {
		return window.linkPropsPlus;
	},

	buttonId: "linkPropsPlus-toolbarButton",
	get button() {
		var btn = document.getElementById(this.buttonId);
		if(!btn)
			return null;
		delete this.button;
		return this.button = btn;
	},
	get panelPopup() {
		delete this.panelPopup;
		return this.panelPopup = document.getElementById("PanelUI-popup");
	},
	buttonDragOver: function(e) {
		if(this.hasDropLink(e)) {
			var dt = e.dataTransfer;
			dt.effectAllowed = dt.dropEffect = "link";
			e.preventDefault();
			e.stopPropagation();
			if(!this.button.hasAttribute("checked"))
				this.button.setAttribute("checked", "true");
		}
	},
	_firstPanelDragOver: 0,
	panelButtonDragOver: function(e) {
		var panelBtn = e.currentTarget;
		if(e.target != panelBtn)
			return;
		if(!this.lpp.pu.get("dnd.autoOpenPanel"))
			return;
		var panelPopup = this.panelPopup;
		if(panelPopup && panelPopup.state != "closed")
			return;
		var placement = CustomizableUI.getPlacementOfWidget(this.buttonId);
		var area = placement && placement.area;
		if(area != CustomizableUI.AREA_PANEL)
			return;
		if(!this.hasDropLink(e))
			return;
		if(!this._firstPanelDragOver) {
			this._firstPanelDragOver = Date.now();
			return;
		}
		if(Date.now() - this._firstPanelDragOver < this.lpp.pu.get("dnd.openPanelDelay"))
			return;
		this._firstPanelDragOver = 0;
		panelBtn.click();

		var window = panelPopup.ownerDocument.defaultView;
		panelPopup.addEventListener("popuphiding", function destroy(e) {
			panelPopup.removeEventListener(e.type, destroy, false);
			window.removeEventListener("dragover", handleDragOver, true);
			destroyAutoClose();
		}, false);
		var closeTimer = 0;
		var closeDelay = this.lpp.pu.get("dnd.closePanelDelay");
		var initAutoClose = function() {
			if(closeTimer)
				return;
			closeTimer = window.setTimeout(function() {
				panelPopup.hidePopup();
			}, closeDelay);
		};
		var destroyAutoClose = function() {
			if(!closeTimer)
				return;
			window.clearTimeout(closeTimer);
			closeTimer = 0;
		};
		var handleDragOver = function(e) {
			var trg = e.originalTarget || e.target;
			for(var node = trg; node; node = node.parentNode) {
				if(node == panelPopup || node == panelBtn) {
					destroyAutoClose();
					return;
				}
			}
			initAutoClose();
		};
		window.addEventListener("dragover", handleDragOver, true);
	},
	buttonDrop: function(e) {
		this.buttonDragLeave(e);
		var data = this.getDropLink(e);
		if(!data)
			return;
		// Prevent legacy "dragdrop" event (Firefox 3.6 and older), if received "drop" event
		e.preventDefault();
		e.stopPropagation();
		var links = data.links;
		if(!this.lpp.ut.allowOpen(links.length))
			return;
		var panelPopup = this.panelPopup;
		if(panelPopup && panelPopup.state != "closed")
			panelPopup.hidePopup();
		links.forEach(function(uri) {
			var sourceWindow = data.sourceWindows[uri] || data.sourceWindow;
			this.lpp.ut.openWindow({
				uri:          uri,
				referer:      data.referers[uri] || data.referer,
				sourceWindow: sourceWindow,
				autostart:    true,
				parentWindow: sourceWindow && window,
				sourceTab:    sourceWindow && this.getTabForContentWindow(sourceWindow)
			});
		}, this);
	},
	buttonDragLeave: function(e) {
		if(this.button.hasAttribute("checked"))
			this.button.removeAttribute("checked");
	},
	panelButtonDragLeave: function(e) {
		this._firstPanelDragOver = 0;
	},
	getTabForContentWindow: function(win) {
		var top = win.top;
		var browserWindow = top.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIWebNavigation)
			.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
			.rootTreeItem
			.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
			.getInterface(Components.interfaces.nsIDOMWindow);
		if(!browserWindow || !("gBrowser" in browserWindow))
			return null;
		var gBrowser = browserWindow.gBrowser;
		if(!gBrowser || !("browsers" in gBrowser)) // View source window?
			return null;
		if("_getTabForContentWindow" in gBrowser) try {
			return gBrowser._getTabForContentWindow(top);
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		var browsers = gBrowser.browsers;
		var tabs = gBrowser.tabs || gBrowser.tabContainer.childNodes;
		for(var i = 0, l = browsers.length; i < l; ++i)
			if(browsers[i].contentWindow == top)
				return tabs[i];
		return null;
	},
	hasDropLink: function(e) {
		return !!this.getDropLink(e);
	},
	getDropLink: function(e) {
		var dt = e.dataTransfer;
		if(!dt)
			return null;
		var types = dt.types;
		var links = [];
		var referers = { __proto__: null };
		var sourceWindows = { __proto__: null };
		function getDataAt(type, i) {
			return dt.getDataAt && dt.getDataAt(type, i)
				|| dt.mozGetDataAt && dt.mozGetDataAt(type, i)
				|| dt.getData && dt.getData(type) // Fallback
				|| "";
		}
		for(var i = 0, c = dt.mozItemCount || dt.itemCount || 1; i < c; ++i) {
			var data = null;
			if(types.contains("text/uri-list"))
				links.push.apply(links, (data = getDataAt("text/uri-list", i)).split("\n"));
			if(!data && types.contains("text/x-moz-url"))
				links.push((data = getDataAt("text/x-moz-url", i)).split("\n")[0]);
			if(!data && types.contains("application/x-moz-tabbrowser-tab")) {
				var tab = data = getDataAt("application/x-moz-tabbrowser-tab", i);
				if(tab && tab.linkedBrowser) {
					var uri = tab.linkedBrowser.currentURI.spec;
					if(links.indexOf(uri) == -1) {
						links.push(uri);
						referers[uri] = uri;
						sourceWindows[uri] = tab.linkedBrowser.contentWindow;
					}
				}
			}
			if(!data && types.contains("text/plain")) {
				links.push.apply(
					links,
					getDataAt("text/plain", i)
						.split(/\s+/)
						.map(this.lpp.cmd.extractURI, this.lpp.cmd)
				);
			}
		}
		links = links.filter(function(uri, i) { // Remove empty strings and duplicates
			return uri && links.indexOf(uri) == i;
		});
		if(!links.length)
			return null;
		var sourceNode = dt.mozSourceNode || dt.sourceNode || null;
		var sourceDoc = sourceNode && sourceNode.ownerDocument;
		return {
			links: links,
			referer: sourceDoc && sourceDoc.documentURI || null,
			referers: referers,
			sourceWindow: sourceDoc && sourceDoc.defaultView,
			sourceWindows: sourceWindows
		};
	}
};