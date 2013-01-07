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
		var w = this._parentWindow;
		if(w && w.closed)
			w = this._parentWindow = null;
		return w;
	},
	parentTab: null,

	instantInit: function() {
		if("arguments" in window) {
			var wa = window.arguments || [];
			var uri = this.uri = wa[0] || "";
			this.referer = this.svc.checkReferer(wa[1], uri) || null;
			this.autostart = !!wa[2];
			if(this.autostart)
				this.cantGet = true;
			this._parentWindow = wa[3];
			this.parentTab = wa[4];
		}
		this.uriChanged(this.autostart);
		this.setTitle();
		this.prefsChanged("ownWindow.clickSelectsAll");
		window.addEventListener("resize", this, false);
	},
	handleEvent: function(e) {
		if(e.type == "resize") {
			window.removeEventListener(e.type, this, false);
			this.fixWindowHeight();
		}
	},
	prefsChanged: function(pName) {
		if(pName == "ownWindow.clickSelectsAll") {
			var csa = this.pu.pref("ownWindow.clickSelectsAll");
			this.uriField.setAttribute("clickSelectsAll", csa);
			this.refererField.setAttribute("clickSelectsAll", csa);
		}
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

	setTitle: function() {
		var ttl = document.title.replace(/\s+\[.*\]$/, "");
		var uri = this.uri;
		if(uri) {
			var uri = this.ut.decodeURI(uri);
 			var fName = /[^\/\\]+$/.test(uri)
 				&& RegExp.lastMatch.replace(/#.*$/, "")
				|| uri;
			ttl += " [" + fName + "]";
		}
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
		this.getHeadersBtn.disabled = val;
	},
	getHeaders: function() {
		var uri = this.uri;
		if(!uri || this.cantGet)
			return;
		this.cantGet = true;
		this.setTitle();
		this.svc.getHeaders(true);
		this.fixWindowHeight();
	},
	onStopRequest: function(ok) {
		this.cantGet = !this.uri;
		if(!ok)
			return;
	},
	uriChanged: function(cantGet) {
		var uri = this.uri;
		this.cantGet = cantGet || this.svc.activeRequest || !uri;
		var notHttp = !/^https?:\//.test(uri);
		this.refererField.setAttribute("lpp_notUsed", notHttp);
		this.refererField.previousSibling.setAttribute("lpp_notUsed", notHttp);
		var empty = !uri;
		this.uriField.setAttribute("lpp_empty", empty);
		this.uriField.parentNode.setAttribute("lpp_empty", empty);
	},
	uriChangedDelay: function() {
		setTimeout(function(_this) {
			_this.uriChanged();
		}, 0, this);
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
		if(contentHeight > containerHeight)
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