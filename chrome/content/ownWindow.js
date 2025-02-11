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
		// Move out from hidden <vbox> to make accessible using context="" attribute
 		document.documentElement.appendChild(this.$l("context"));
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
	destroyTabWatcherTimer: 0,
	destroyTabWatcherDelayed: function(useDelay) {
		if(!useDelay)
			return this.destroyTabWatcher();
		return this.destroyTabWatcherTimer = setTimeout(function(_this) {
			_this.destroyTabWatcher();
		}, 3e3, this);
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
			var tab = e.originalTarget || e.target;
			if(tab == this.parentTab)
				this.setTitle();
			else if(e.explicitOriginalTarget == this.parentTab) { // Private Tab 0.2.1.3+
				this.parentTab = tab;
				clearTimeout(this.destroyTabWatcherTimer);
				this.setTitle();
			}
		}
		else if(type == "TabClose") {
			var tab = e.originalTarget || e.target;
			if(tab == this.parentTab) // Will wait for Private Tab + toggling using duplication
				this.destroyTabWatcherDelayed(tab.collapsed);
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
		return this.uriField = this.$l("uri");
	},
	get uri() {
		return this.uriField.value;
	},
	set uri(val) {
		this.uriField.value = this.ut.decodeURI(val || "");
	},
	get refererField() {
		delete this.refererField;
		return this.refererField = this.$l("referer");
	},
	get referer() {
		return this.refererField.value || null;
	},
	set referer(val) {
		this.refererField.value = this.ut.decodeURI(val || "");
	},
	$l: function(id) {
		return document.getElementById("linkPropsPlus-" + id);
	},

	get baseTitle() {
		delete this.baseTitle;
		return this.baseTitle = document.title;
	},
	setTitle: function() {
		var ttl = this.baseTitle;
		var uri = this.svc.requestURI || this.uri;
		var crop = this.pu.get("ownWindow.cropFileNameInTitle");
		if(uri && crop > 0 && this.svc.isValidURI(uri)) {
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
		if(this.svc.isPrivate)
			ttl += this.ut.getLocalized("privateTitleModifier");
		document.title = ttl;
	},
	get getHeadersBtn() {
		delete this.getHeadersBtn;
		return this.getHeadersBtn = this.$l("getHeaders");
	},
	get cantGet() {
		return this.getHeadersBtn.disabled;
	},
	set cantGet(val) {
		this.getHeadersBtn.disabled = val;
		var sendGet = this.$l("context-sendGetRequest");
		if(sendGet)
			sendGet.disabled = val;
		else { // Wait for overlay loading
			setTimeout(function(_this) {
				_this.$l("context-sendGetRequest").disabled = val;
			}, 0, this);
		}
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
		var fixedUri = this.fixProtocol(uri);
		if(fixedUri) {
			uri = this.uri = fixedUri;
			this.svc.requestFailed("fixedURI");
			this.uriChangedDelay();
		}
		this.svc.getHeaders(opts);
		this.setTitle();
		this.fixWindowHeight();
	},
	setURI: function(e) {
		if(e.button != 0)
			return;
		var uri = this.ut.readFromClipboard();
		var fixedUri = uri && this.fixProtocol(uri);
		if(fixedUri) {
			uri = fixedUri;
			this.svc.requestFailed("fixedURI");
		}
		if(this.svc.isValidURI(uri)) {
			this.uri = uri;
			this.uriChangedDelay();
		}
		else {
			this.svc.requestFailed("badURI");
		}
	},
	fixProtocol: function(uri) {
		return !/^[^:./]+:/.test(uri) && !this.svc.isValidURI(uri) && "http://" + uri;
	},
	_ignoreAuxclick: false,
	_lastAuxclick: 0,
	setFakeReferer: function(e) {
		var et = e.type;
		if(et == "dblclick" && e.button > 0)
			this._ignoreAuxclick = true;
		else if(et == "auxclick" && !this._ignoreAuxclick) {
			var tl = this._lastAuxclick;
			var tn = this._lastAuxclick = Date.now();
			if(tn - tl > this.pu.get("ownWindow.dblclickDelay"))
				return;
		}

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
		var notHttp = "" + !/^https?:\//i.test(uri);
		var rf = this.refererField;
		if(rf.getAttribute("lpp_notUsed") != notHttp) {
			rf.setAttribute("lpp_notUsed", notHttp);
			rf.previousSibling.setAttribute("lpp_notUsed", notHttp);
		}
		var empty = "" + !uri;
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