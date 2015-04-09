var linkPropsPlusWnd = {
	autostart: true,

	get ut() {
		return window.linkPropsPlusUtils;
	},
	get pu() {
		return window.linkPropsPlusPrefUtils;
	},
	get svc() {
		return window.linkPropsPlusSvc;
	},

	_parentWindow: null,
	get parentWindow() {
		return this.svc.ensureWindowOpened(this._parentWindow);
	},
	parentTab: null,

	_sourceWindow: null,
	get sourceWindow() {
		return this.svc.ensureWindowOpened(this._sourceWindow);
	},

	instantInit: function() {
		if("arguments" in window) {
			// { uri, referer, sourceWindow, autostart, parentWindow, sourceTab }
			var options = window.arguments && window.arguments[0];
			var uri = options.uri || "";
			this.uri = uri;
			this.referer = this.ut.checkReferer(options.referer || "", uri) || null;
			this._sourceWindow = options.sourceWindow || null;
			this.autostart = !!options.autostart;
			if(this.autostart)
				this.cantGet = true;
			this._parentWindow = options.parentWindow || null;
			var tab = this.parentTab = options.sourceTab || null;
			if(tab) {
				var win = tab.ownerDocument.defaultView;
				// https://github.com/Infocatcher/Private_Tab#api-for-other-extensions
				win.addEventListener("PrivateTab:PrivateChanged", this, false);
				win.addEventListener("TabClose", this, false);
				win.addEventListener("unload", this, false);
			}
		}
		this.uriChanged(this.autostart);
		this.setClickSelectsAll();
		window.addEventListener("resize", this, false);
	},
	init: function() {
		this.setTitle();
	},
	destroy: function() {
		this.destroyTabWatcher();
	},
	destroyTabWatcher: function() {
		var tab = this.parentTab;
		if(!tab)
			return;
		this.parentTab = null;
		var win = tab.ownerDocument.defaultView;
		win.removeEventListener("PrivateTab:PrivateChanged", this, false);
		win.removeEventListener("TabClose", this, false);
		win.removeEventListener("unload", this, false);
	},
	handleEvent: function(e) {
		var type = e.type;
		if(type == "resize") {
			window.removeEventListener(type, this, false);
			if(this.svc.fxVersion >= 17) {
				var root = document.documentElement;
				if(root.height > 0)
					window.resizeTo(+root.width, +root.height);
			}
			this.fixWindowHeight();
		}
		else if(type == "PrivateTab:PrivateChanged") {
			if((e.originalTarget || e.target) == this.parentTab)
				this.setTitle();
		}
		else if(type == "TabClose") {
			if((e.originalTarget || e.target) == this.parentTab)
				this.destroyTabWatcher();
		}
		else if(type == "unload") {
			this.destroyTabWatcher();
		}
	},
	prefsChanged: function(pName, pVal) {
		if(pName == "ownWindow.clickSelectsAll")
			this.setClickSelectsAll();
		else if(pName == "ownWindow.cropFileNameInTitle")
			this.setTitle();
	},

	get uriField() {
		delete this.uriField;
		return this.uriField = document.getElementById("linkPropsPlus-uri");
	},
	get uri() {
		return this.uriField.value;
	},
	set uri(val) {
		this.uriField.value = val || "";
	},
	get refererField() {
		delete this.refererField;
		return this.refererField = document.getElementById("linkPropsPlus-referer");
	},
	get referer() {
		return this.refererField.value || null;
	},
	set referer(val) {
		this.refererField.value = val || "";
	},

	get baseTitle() {
		delete this.baseTitle;
		return this.baseTitle = document.title;
	},
	setTitle: function() {
		var ttl = this.baseTitle;
		var uri = this.svc.requestURI || this.uri;
		if(uri) {
			var crop = this.pu.get("ownWindow.cropFileNameInTitle");
			if(crop > 0) {
				var uri = this.ut.decodeURI(uri).replace(/#.*$/, "");
				var fName = /([^\/\\]+\/?|[^\/\\]+\/\?.*?)$/.test(uri)
					? RegExp.lastMatch
					: uri;
				if(
					fName.length < crop*0.4
					&& /^[^.\/?&:]+\/?$/.test(fName) // Looks like "directory": dir or dir/
				) {
					var lastSlash = uri.substr(-1) == "/" ? "/" : "";
					var path = [];
					var maxLen = crop*0.6;
					var curLen = 0;
					var dirs = uri
						.replace(/\/$/, "")
						.replace(/^[^:]+:\/*[^\/]+\//, "") // Remove host: http://example.com/dir/ -> dir/
						.split("/");
					var last = dirs.length - 1;
					if(last >= 0 && dirs[last] + lastSlash == fName) {
						for(var i = last; i >= 0; --i) {
							var dir = dirs[i];
							curLen += dir.length + 1;
							if(curLen > maxLen)
								break;
							path.push(dir);
						}
						fName = path.reverse().join("/") + lastSlash; // Example: dir1/dir2/dir3/
					}
				}
				if(fName.length > crop) {
					var half = Math.floor(crop/2);
					fName = fName.substr(0, half) + "…" + fName.substr(half - crop);
				}
				ttl += " [" + fName + "]";
			}
		}
		if(this.svc.isPrivate)
			ttl += this.ut.getLocalized("privateTitleModifier");
		document.title = ttl;
	},
	get getHeadersBtn() {
		delete this.getHeadersBtn;
		return this.getHeadersBtn = document.getElementById("linkPropsPlus-getHeaders");
	},
	get cantGet() {
		return this.getHeadersBtn.disabled;
	},
	set cantGet(val) {
		this.getHeadersBtn.disabled =
			document.getElementById("linkPropsPlus-context-sendGetRequest2").disabled = val;
	},
	getHeaders: function(e) {
		var uri = this.uri;
		if(!uri || this.cantGet)
			return;
		this.cantGet = true;
		var opts = e && !(e instanceof Event) ? e : {
			clear: true,
			bypassCache: e && (
				e.shiftKey
				|| e.type == "click" && e.button > 0
			)
		};
		this.svc.getHeaders(opts);
		this.setTitle();
		this.fixWindowHeight();
	},
	setURI: function(e) {
		if(e.button != 0)
			return;
		var uri = this.ut.readFromClipboard();
		try {
			this.ut.ios.newURI(uri, null, null); // Will throw for invalid URIs
			this.uri = uri;
			this.uriChangedDelay();
		}
		catch(e) {
			this.svc.requestFailed("badURI");
		}
	},
	setFakeReferer: function(e) {
		var type = this.pu.get("useFakeReferer") || 2;
		if(e.button > 0 || e.ctrlKey || e.altKey || e.shiftKey || e.metaKey)
			type = type == 2 ? 1 : 2;
		this.referer = this.ut.getFakeReferer(this.uri, type);
	},
	onStopRequest: function(ok) {
		this.cantGet = !this.uri;
	},
	uriChanged: function(cantGet) {
		var uri = this.uri;
		this.cantGet = cantGet || this.svc.activeRequest || !uri;
		var notHttp = String(!/^https?:\//.test(uri));
		var rf = this.refererField;
		if(rf.getAttribute("lpp_notUsed") != notHttp) {
			rf.setAttribute("lpp_notUsed", notHttp);
			rf.previousSibling.setAttribute("lpp_notUsed", notHttp);
		}
		var empty = String(!uri);
		var uf = this.uriField;
		if(uf.getAttribute("lpp_empty") != empty) {
			uf.setAttribute("lpp_empty", empty);
			uf.parentNode.setAttribute("lpp_empty", empty);
		}
	},
	uriChangedDelay: function() {
		setTimeout(function(_this) {
			_this.uriChanged();
		}, 0, this);
	},
	setClickSelectsAll: function() {
		var csa = this.pu.get("ownWindow.clickSelectsAll");
		this.uriField.setAttribute("clickSelectsAll", csa);
		this.refererField.setAttribute("clickSelectsAll", csa);
	},
	closeOther: function() {
		var ws = this.ut.wm.getEnumerator("linkPropsPlus:ownWindow");
		while(ws.hasMoreElements()) {
			var w = ws.getNext();
			if(w != window)
				w.close();
		}
	},
	fixWindowHeight: function() {
		var de = document.documentElement;
		var contentHeight = 0;
		var ac = document.getAnonymousNodes(de);
		for(var i = 0, l = ac.length; i < l; ++i) {
			var a = ac[i];
			if(a.parentNode == de)
				contentHeight += this.getHeight(a);
		}
		var containerHeight = this.getHeight(de, true);
		if(contentHeight > containerHeight || !this.pu.get("ownWindow.showHttpHeaders"))
			window.resizeBy(0, contentHeight - containerHeight);
	},
	getNumProperty: function(elt, pName) {
		return parseFloat(elt.ownerDocument.defaultView.getComputedStyle(elt, null)[pName]) || 0;
	},
	getHeight: function(elt, external) {
		var h = this.getNumProperty(elt, "height");
		if(external)
			return h;
		return h
			+ this.getNumProperty(elt, "paddingTop") + this.getNumProperty(elt, "paddingBottom")
			+ this.getNumProperty(elt, "borderTopWidth") + this.getNumProperty(elt, "borderBottomWidth")
			+ this.getNumProperty(elt, "marginTop") + this.getNumProperty(elt, "marginBottom");
	}
};