var linkPropsPlusOpts = {
	showApply: true,
	get pu() {
		return window.linkPropsPlusPrefUtils;
	},
	init: function() {
		this.pu.init();
		var de = document.documentElement;
		var applyBtn = this.applyBtn = de.getButton("extra1");
		if(this.pu.getPref("browser.preferences.instantApply")) {
			this.showApply = false;
			applyBtn.hidden = true;
		}
		else {
			this.saveState();
			applyBtn.setAttribute("icon", "apply");

			// Insert Apply button between Ok and Cancel
			var okBtn = de.getButton("accept");
			var cancelBtn = de.getButton("cancel");
			var btnBox = okBtn.parentNode;
			for(var node = btnBox.firstChild; node; node = node.nextSibling) {
				if(node == okBtn || node == cancelBtn) {
					node = node.nextSibling;
					if(node != applyBtn)
						btnBox.insertBefore(applyBtn, node);
					break;
				}
			}
		}

		var appInfo = Components.classes["@mozilla.org/xre/app-info;1"]
			.getService(Components.interfaces.nsIXULAppInfo);
		var app = appInfo.name;

		// Hide options for item in App menu and Wab Developer menu for applications without them
		var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator);
		var browserWin = wm.getMostRecentWindow("navigator:browser")
			|| wm.getMostRecentWindow("mail:3pane");
		if(browserWin && "linkPropsPlus" in browserWin) {
			if(!browserWin.linkPropsPlus.appMi)
				this.hide(document.getElementById("appMenuOptions"), true);
			if(!browserWin.linkPropsPlus.toolsMiSub || app == "Thunderbird")
				this.hide(this.e("showInToolsMenuSub"), true);
		}

		// Show settings for Properties dialog, if available
		var propsBox = document.getElementById("propertiesBox");
		if(
			(app == "Firefox" || app == "Pale Moon")
			&& parseFloat(appInfo.version) >= 3.6
		) {
			var guid = "properties@darktrojan.net";
			if("@mozilla.org/extensions/manager;1" in Components.classes) {
				Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
					.getService(Components.interfaces.mozIJSSubScriptLoader)
					.loadSubScript("chrome://linkpropsplus/content/extsHelper.js");
				linkPropsPlusExtensionsHelper.isAvailable(guid) && this.hide(propsBox, false);
			}
			else try { // Firefox 4+
				Components.utils["import"]("resource://gre/modules/AddonManager.jsm");
				var _this = this;
				AddonManager.getAddonByID(guid, function(addon) {
					if(addon && addon.isActive) {
						_this.hide(propsBox, false)
						_this.disableDecodeCheckbox();
						_this.disableHeadersOptions();
						_this._sizeChanged && window.sizeToContent();
					}
				});
			}
			catch(e) {
				Components.utils.reportError(e);
			}
		}
		else if(app != "Thunderbird") {
			this.hide(propsBox, false);
		}

		this._sizeChanged && window.sizeToContent();

		this.setDisabled();
		this.highlight();
	},
	prefsChanged: function(pName, pVal) {
		setTimeout(function(_this) {
			_this.setDisabled();
		}, 0, this);
	},
	e: function(p) {
		return document.getElementsByAttribute("preference", p)[0];
	},
	_sizeChanged: false,
	hide: function(node, hide) {
		var h = node.getAttribute("hidden");
		if(!hide ^ h == "true")
			return;
		if(hide)
			node.setAttribute("hidden", "true");
		else
			node.removeAttribute("hidden");
		this._sizeChanged = true;
	},
	setDisabled: function() {
		this.disableDecodeCheckbox();
		this.disableHeadersOptions();
		this.disableMenusCheckboxes();
		this.disableAutoCloseOptions();
		this.disableTestResumabilityDelay();
	},
	disableDecodeCheckbox: function() {
		this.e("decodeURIs").disabled = (
				document.getElementById("propertiesBox").getAttribute("hidden") == "true"
				|| !this.e("propertiesDirectURI").checked
			)
			&& !this.e("ownWindowDirectURI").checked
			&& !this.e("downloadDirectURI").checked;
	},
	disableHeadersOptions: function() {
		this.e("testDownloadResumability.showHttpHeaders").disabled =
			this.e("showCaptionsInHttpHeaders").disabled = (
				document.getElementById("propertiesBox").getAttribute("hidden") == "true"
				|| !this.e("propertiesHeaders").checked
			)
			&& !this.e("ownWindowHeaders").checked
			&& !this.e("downloadHeaders").checked;
	},
	disableMenusCheckboxes: function() {
		this.e("icon.contextMenu").disabled = !this.e("context.onLinks").checked && !this.e("context.onSelection").checked;
		this.e("context.onSelection.inInputFields").disabled = !this.e("context.onSelection").checked;
		this.e("icon.toolsMenu").disabled = this.e("showInToolsMenuSub").disabled = !this.e("showInToolsMenu").checked;
		this.e("icon.appMenu").disabled = !this.e("showInAppMenu").checked;
	},
	disableAutoCloseOptionsDelay: function() {
		setTimeout(function(_this) {
			_this.disableAutoCloseOptions();
		}, 0, this);
	},
	disableAutoCloseOptions: function() {
		var dis = !this.e("autoClose.enabled").checked;
		this.e("autoClose.delay").disabled = dis;
		this.e("autoClose.dontCloseUnderCursor").disabled
			= this.e("autoClose.onlyAfterRequest").disabled
			= dis || parseInt(this.e("autoClose.delay").inputField.value) < 1000;
	},
	disableTestResumabilityDelay: function() {
		setTimeout(function(_this) {
			_this.disableTestResumability();
		}, 0, this);
	},
	disableTestResumability: function() {
		var dis = ![
			"propertiesStatus",
			"ownWindowStatus",
			"downloadStatus"
		].some(function(id) {
			var ch = this.e(id);
			var bo = ch.boxObject;
			return bo.width > 0 && bo.height > 0
				&& ch.getAttribute("checked") == "true";
		}, this);
		var testResumability = this.e("testDownloadResumability");
		testResumability.disabled = dis;
		this.e("testDownloadResumability.download").disabled = dis || !testResumability.checked;
	},
	highlight: function(win) {
		var cur = document.getElementsByAttribute("lpp_current", "true");
		if(cur.length)
			cur[0].removeAttribute("lpp_current");
		if(!win)
			win = window.opener;
		if(!win || !("linkPropsPlusSvc" in win))
			return;
		var elpSvc = win.linkPropsPlusSvc;
		var boxId;
		if(elpSvc.isPropsDialog)
			boxId = "propertiesBox";
		else if(elpSvc.isOwnWindow)
			boxId = "ownWindowBox";
		else if(elpSvc.isDownloadDialog)
			boxId = "downloadBox";
		else
			return;
		document.getElementById(boxId).setAttribute("lpp_current", "true");
	},
	savePrefpanes: function() {
		Array.prototype.forEach.call(
			document.getElementsByTagName("prefpane"),
			function(pp) {
				pp.writePreferences(true /* aFlushToDisk */);
			}
		);
		if(this.showApply)
			this.saveState();
	},
	checkUnsavedDelay: function() {
		this.showApply && setTimeout(function(_this) {
			_this.checkUnsaved();
		}, 0, this);
	},
	checkUnsaved: function() {
		if(this.showApply)
			this.applyBtn.disabled = !this.hasUnsaved;
	},
	saveState: function() {
		Array.prototype.forEach.call(
			document.getElementsByAttribute("preference", "*"),
			function(node) {
				node.__savedValue = this.getNodeValue(node);
			},
			this
		);
		this.applyBtn.disabled = true;
	},
	get hasUnsaved() {
		return Array.prototype.some.call(
			document.getElementsByAttribute("preference", "*"),
			function(node) {
				return node.__savedValue != this.getNodeValue(node);
			},
			this
		);
	},
	getNodeValue: function(node) {
		if("checked" in node)
			return node.checked;
		if("inputField" in node)
			return node.inputField.value;
		return node.value;
	}
};