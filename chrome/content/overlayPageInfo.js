var linkPropsPlusPageInfo = {
	get ut() {
		return window.linkPropsPlusUtils;
	},
	get pu() {
		return window.linkPropsPlusPrefUtils;
	},
	init: function() {
		var btn1 = document.getElementById("linkPropsPlus-getLinkProperties");
		var trg1 = document.getElementById("imagesaveasbutton");
		if(btn1 && trg1)
			trg1.parentNode.insertBefore(btn1, trg1);
		var btn2 = document.getElementById("linkPropsPlus-getLinksProperties");
		if(btn2)
			btn2.parentNode.insertBefore(btn2, btn2.previousSibling);
	},
	handleEvent: function(e) {
		this.init();
	},
	showLinksProperties: function() {
		// See chrome://browser/content/pageinfo/pageInfo.js
		//~ todo: test in old versions
		var tree = document.getElementById("imagetree");
		var numRanges = tree.view.selection.getRangeCount();
		var links = { __proto__: null };
		var count = 0;
		for(var t = 0; t < numRanges; ++t) {
			var start = {};
			var end   = {};
			tree.view.selection.getRangeAt(t, start, end);
			for(var v = start.value; v <= end.value; ++v) {
				var data = gImageView.data[v];
				var uri  = data[COL_IMAGE_ADDRESS];
				if(uri in links)
					continue;
				var item = data[COL_IMAGE_NODE];
				var referer = item.ownerDocument.location.href;
				links[uri] = referer;
				++count;
			}
		}
		if(this.allowOpen(count))
			for(var uri in links)
				this.ut.openWindow(uri, links[uri], true);
	},
	allowOpen: function(n) {
		var max = this.pu.pref("openMultipleLimit") || 0;
		if(n <= max)
			return true;
		return Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			.getService(Components.interfaces.nsIPromptService)
			.confirm(
				window,
				this.ut.getLocalized("openMultipleLimitTitle"),
				this.ut.getLocalized("openMultipleLimitMessage", [n])
			);
	}
};
window.addEventListener("load", linkPropsPlusPageInfo, false);