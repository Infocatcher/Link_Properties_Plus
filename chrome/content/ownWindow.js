var linkPropsPlusWnd = {
	autostart: true,
	autostop: false,

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

	get topWindow() {
		try {
			var top = "QueryInterface" in window
				? window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIWebNavigation)
					.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
					.rootTreeItem
					.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
					.getInterface(Components.interfaces.nsIDOMWindow)
				: window.docShell.rootTreeItem.domWindow; // Firefox 70+
		}
		catch(e) {
			Components.utils.reportError(e);
		}
		delete this.topWindow;
		return this.topWindow = top;
	},
	get inTab() {
		var top = this.topWindow;
		delete this.inTab;
		return this.inTab = top && top != window;
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
		else if(this.inTab) {
			this.uri = this.argUri;
			this.referer = this.argReferer;
			if(this.argAutostop) {
				this.autostart = false;
				this.autostop = true;
			}
			var top = this.topWindow;
			this._parentWindow = top;
			this._sourceWindow = window;
			this.parentTab = top.gBrowser && top.gBrowser.selectedTab;
			window.addEventListener("popstate", this, false);
		}
		this.uriChanged(this.autostart);
		this.setClickSelectsAll();
		this.addTabIcon();
		!this.inTab && window.addEventListener("resize", this, false);
	},
	addTabIcon: function() {
		var nsHTML = "http://www.w3.org/1999/xhtml";
		var canvas = document.createElementNS(nsHTML, "canvas");
		if(!("toDataURL" in canvas))
			return; // Too old browser
		canvas.width = canvas.height = 16;
		var ctx = canvas.getContext("2d");
		var img = new Image();
		img.onload = function() {
			ctx.drawImage(img, 0, 0, 16, 16, 0, 0, 16, 16);
			var icon = document.createElementNS(nsHTML, "link");
			icon.rel = "shortcut icon";
			icon.style.display = "none";
			icon.href = canvas.toDataURL();
			document.documentElement.appendChild(icon);
		};
		img.src = "chrome://linkpropsplus/skin/icons16.png";
	},
	init: function() {
		this.setTitle();
	},
	destroy: function() {
		this.destroyTabWatcher();
		delete this.topWindow;
		window.removeEventListener("popstate", this, false);
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
		else if(type == "popstate") {
			this.uri = this.argUri;
			this.referer = this.argReferer;
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

	get tbUri() {
		delete this.tbUri;
		return this.tbUri = this.$l("uri");
	},
	get argUri() {
		return /[?&]uri=([^?&#]+)/.test(location.href) && decodeURIComponent(RegExp.$1) || "";
	},
	get uri() {
		return this.tbUri.value;
	},
	set uri(val) {
		this.tbUri.value = this.ut.decodeURI(val || "");
	},
	get tbReferer() {
		delete this.tbReferer;
		return this.tbReferer = this.$l("referer");
	},
	get argReferer() {
		return /[?&]referer=([^?&#]+)/.test(location.href) && decodeURIComponent(RegExp.$1) || "";
	},
	get referer() {
		return this.tbReferer.value || null;
	},
	set referer(val) {
		this.tbReferer.value = this.ut.decodeURI(val || "");
	},
	get argAutostop() {
		return /[?&]autostart=(?:0|false)(?:[&#]|$)/.test(location.href);
	},
	$l: function(id) {
		return document.getElementById("linkPropsPlus-" + id);
	},
	updArgs: function() {
		var uri = this.uri;
		var referer = this.referer || "";
		var loc = location.href.replace(/\/ownWindow\.xul/, "/properties.xul");
		var url = loc.replace(/\?.*$/, "");
		if(uri || referer)
			url += "?uri=" + encodeURIComponent(uri) + "&referer=" + encodeURIComponent(referer);
		if(this.autostop)
			url += (uri || referer ? "&" : "?") + "autostart=0";
		if(
			url == loc
			|| url == loc.replace(/([?&])autostart=false([&#]|$)/, "$1autostart=0$2")
		)
			return;
		history.pushState({}, "", url);
	},
	_updArgsTimer: 0,
	updArgsProxy: function() {
		if(!this.inTab || !("pushState" in history))
			return;
		this._updArgsTimer && clearTimeout(this._updArgsTimer);
		this._updArgsTimer = setTimeout(function(_this) {
			_this._updArgsTimer = 0;
			_this.updArgs();
		}, 250, this);
	},

	get baseTitle() {
		delete this.baseTitle;
		return this.baseTitle = document.title;
	},
	setTitle: function() {
		var ttl = this.baseTitle;
		var uri = this.svc.directURI || this.svc.requestURI || this.uri;
		var crop = this.pu.get("ownWindow.cropFileNameInTitle");
		if(uri && crop > 0 && this.svc.isValidURI(uri)) {
			var uri = this.ut.decodeURI(uri).replace(/#.*$/, "");
			var fName = /([^\/\\]+\/?|[^\/\\]+\/\?.*?)$/.test(uri)
				? RegExp.lastMatch
				: uri;
			if(
				fName.length < crop*0.4
				&& /^[^\/?&:]+\/?$/.test(fName) // Looks like file or directory: file.ext or dir or dir/
			) {
				var lastSlash = uri.substr(-1) == "/" ? "/" : "";
				var path = [];
				var maxLen = crop*0.7;
				var curLen = 0;
				var dirs = uri
					.replace(/\/$/, "")
					//.replace(/^[^:]+:\/*[^\/]+\//, "") // Remove host: http://example.com/dir/ -> dir/
					.replace(/^[^:]+:\/*(?:www\.)?/, "") // Remove protocol: http://www.example.com/dir/ -> example.com/dir/
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
		if(ttl != document.title)
			document.title = ttl;
	},
	get btnHeaders() {
		delete this.btnHeaders;
		return this.btnHeaders = this.$l("getHeaders");
	},
	get cantGet() {
		return this.btnHeaders.disabled;
	},
	set cantGet(val) {
		this.btnHeaders.disabled = val;
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
		!this.inTab && this.fixWindowHeight();
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
		this.updArgsProxy();
	},
	onStopRequest: function(ok) {
		this.cantGet = !this.uri;
	},
	uriChanged: function(cantGet) {
		var uri = this.uri;
		this.cantGet = cantGet || this.svc.activeRequest || !uri;
		var notHttp = "" + !/^https?:\//i.test(uri);
		var tbr = this.tbReferer;
		if(tbr.getAttribute("lpp_notUsed") != notHttp) {
			tbr.setAttribute("lpp_notUsed", notHttp);
			tbr.previousSibling.setAttribute("lpp_notUsed", notHttp);
		}
		var empty = "" + !uri;
		var tbu = this.tbUri;
		if(tbu.getAttribute("lpp_empty") != empty) {
			tbu.setAttribute("lpp_empty", empty);
			tbu.parentNode.setAttribute("lpp_empty", empty);
		}
		this.updArgsProxy();
	},
	_uriChangedTimer: 0,
	uriChangedDelay: function() {
		if(this._uriChangedTimer)
			return;
		this._uriChangedTimer = setTimeout(function(_this) {
			_this._uriChangedTimer = 0;
			_this.uriChanged();
		}, 0, this);
	},
	setClickSelectsAll: function() {
		var csa = this.pu.get("ownWindow.clickSelectsAll");
		this.tbUri.setAttribute("clickSelectsAll", csa);
		this.tbReferer.setAttribute("clickSelectsAll", csa);
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