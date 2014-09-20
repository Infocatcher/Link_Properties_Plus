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
	},
	handleEvent: function(e) {
		if(e.type == "load")
			this.init();
	},
	showLinksProperties: function() {
		// See chrome://browser/content/pageinfo/pageInfo.js
		//~ todo: test in old versions
		var tree = document.getElementById("imagetree");
		var numRanges = tree.view.selection.getRangeCount();
		var links = { __proto__: null };
		var wins = { __proto__: null };
		var count = 0;
		for(var t = 0; t < numRanges; ++t) {
			var start = {};
			var end   = {};
			tree.view.selection.getRangeAt(t, start, end);
			for(var v = start.value; v <= end.value; ++v) {
				var data = gImageView.data[v];
				var uri  = data[COL_IMAGE_ADDRESS];
				if(uri in links) //~ todo: what to do for the same URIs from different documents?
					continue;
				var item = data[COL_IMAGE_NODE];
				var doc = item.ownerDocument;
				var referer = doc.location.href;
				links[uri] = referer;
				wins[uri] = doc.defaultView;
				++count;
			}
		}
		if(!this.ut.allowOpen(count))
			return;
		var browserWindow = opener && "gBrowser" in opener && "browsers" in opener.gBrowser && opener;
		for(var uri in links) {
			var win = wins[uri];
			this.ut.openWindow(
				uri,
				links[uri],
				win,
				true,
				browserWindow,
				this.getSourceTab(browserWindow, win.top)
			);
		}
	},
	getSourceTab: function(browserWindow, contentWindow) {
		// Based on gBrowser._getTabForContentWindow() (doesn't exist in SeaMonkey)
		var gBrowser = browserWindow.gBrowser;
		var browsers = gBrowser.browsers;
		var tabs = gBrowser.tabs || gBrowser.tabContainer.childNodes;
		for(var i = 0, l = browsers.length; i < l; ++i)
			if(browsers[i].contentWindow == contentWindow)
				return tabs[i];
		return null;
	}
};
window.addEventListener("load", linkPropsPlusPageInfo, false);