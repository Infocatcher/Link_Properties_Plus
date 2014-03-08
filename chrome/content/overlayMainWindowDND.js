var linkPropsPlusDND = {
	get lpp() {
		return window.linkPropsPlus;
	},

	get button() {
		var btn = document.getElementById("linkPropsPlus-toolbarButton");
		if(!btn)
			return null;
		delete this.button;
		return this.button = btn;
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
		links.forEach(function(uri) {
			var sourceWindow = data.sourceWindows[uri] || data.sourceWindow;
			this.lpp.ut.openWindow(
				uri,
				data.referers[uri] || data.referer,
				sourceWindow,
				true,
				sourceWindow && window,
				sourceWindow && this.getTabForContentWindow(sourceWindow)
			);
		}, this);
	},
	buttonDragLeave: function(e) {
		if(this.button.hasAttribute("checked"))
			this.button.removeAttribute("checked");
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
		if(!gBrowser || !(browsers in gBrowser)) // View source window?
			return null;
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
			if(!data && types.contains("text/plain"))
				links.push.apply(links, getDataAt("text/plain", i).split(/\s+/).map(this.lpp.extractURI, this.lpp));
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