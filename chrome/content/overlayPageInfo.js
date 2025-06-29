var linkPropsPlusPageInfo = {
	get ut() {
		Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
			.getService(Components.interfaces.mozIJSSubScriptLoader)
			.loadSubScript("chrome://linkpropsplus/content/utils.js");
		delete this.ut;
		return this.ut = linkPropsPlusUtils;
	},

	init: function() {
		window.removeEventListener("load", this, false);
		var btn1 = document.getElementById("linkPropsPlus-getLinkProperties");
		var trg1 = document.getElementById("imagesaveasbutton");
		if(btn1 && trg1)
			trg1.parentNode.insertBefore(btn1, trg1);
		var btn2 = document.getElementById("linkPropsPlus-getLinksProperties");
		if(btn2)
			btn2.parentNode.insertBefore(btn2, btn2.previousSibling);
		this.sourceTab; // Initialize
	},
	handleEvent: function(e) {
		if(e.type == "load")
			this.init();
	},

	get browserWindow() {
		delete this.browserWindow;
		return this.browserWindow = opener && "gBrowser" in opener && "browsers" in opener.gBrowser && opener;
	},
	get sourceTab() {
		// See chrome://browser/content/pageinfo/pageInfo.js
		// Like loadPageInfo() -> window.opener.gBrowser.selectedBrowser.messageManager
		delete this.sourceTab;
		return this.sourceTab = this.browserWindow && this.browserWindow.gBrowser.selectedTab || null;
	},
	showLinksProperties: function() {
		// See chrome://browser/content/pageinfo/pageInfo.js
		// See https://github.com/Infocatcher/Link_Properties_Plus/issues/22
		var COL_IMAGE_ADDRESS = new window.Function("return COL_IMAGE_ADDRESS;")();
		var COL_IMAGE_NODE    = new window.Function("return COL_IMAGE_NODE;")();
		var tSel = document.getElementById("imagetree").view.selection;
		var numRanges = tSel.getRangeCount();
		var links = { __proto__: null };
		var wins = { __proto__: null };
		var count = 0;
		for(var t = 0; t < numRanges; ++t) {
			var start = {};
			var end   = {};
			tSel.getRangeAt(t, start, end);
			for(var v = start.value; v <= end.value; ++v) {
				var data = gImageView.data[v];
				var uri  = data[COL_IMAGE_ADDRESS];
				if(uri in links) //~ todo: what to do for the same URIs from different documents?
					continue;
				var item = data[COL_IMAGE_NODE];
				var referer = item.ownerDocument && item.ownerDocument.documentURI
					|| item.baseURI
					|| "";
				links[uri] = referer;
				wins[uri] = item.ownerDocument && item.ownerDocument.defaultView || null;
				++count;
			}
		}
		if(!this.ut.allowOpen(count))
			return;
		var browserWindow = this.browserWindow;
		for(var uri in links) {
			var win = wins[uri];
			this.ut.openWindow({
				uri:          uri,
				referer:      links[uri],
				sourceWindow: win,
				autostart:    true,
				parentWindow: browserWindow,
				sourceTab:    this.getSourceTab(browserWindow, win && win.top)
			});
		}
	},
	getSourceTab: function(browserWindow, contentWindow) {
		if(!contentWindow) // Fallback for multi-process mode
			return this.sourceTab;
		var gBrowser = browserWindow.gBrowser;
		if("_getTabForContentWindow" in gBrowser)
			return gBrowser._getTabForContentWindow(contentWindow);
		var browsers = gBrowser.browsers;
		var tabs = gBrowser.tabs || gBrowser.tabContainer.childNodes;
		for(var i = 0, l = browsers.length; i < l; ++i)
			if(browsers[i].contentWindow == contentWindow)
				return tabs[i];
		return null;
	}
};
window.addEventListener("load", linkPropsPlusPageInfo, false);