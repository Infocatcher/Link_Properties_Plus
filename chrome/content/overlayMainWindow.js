var linkPropsPlus = {
	get ut()  { return this.lazy("ut",  "linkPropsPlusUtils",     "utils.js");                },
	get pu()  { return this.lazy("pu",  "linkPropsPlusPrefUtils", "prefUtils.js");            },
	get cmd() { return this.lazy("cmd", "linkPropsPlusCmd",       "overlayMainWindowCmd.js"); },
	get dnd() { return this.lazy("dnd", "linkPropsPlusDND",       "overlayMainWindowDND.js"); },
	get scriptLoader() {
		delete this.scriptLoader;
		return this.scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
			.getService(Components.interfaces.mozIJSSubScriptLoader);
	},
	lazy: function(s, p, file) {
		this.scriptLoader.loadSubScript("chrome://linkpropsplus/content/" + file, window, "UTF-8");
		delete this[s];
		return this[s] = window[p];
	},

	init: function() {
		window.removeEventListener("load", this, false);
		window.addEventListener("unload", this, false);
		this.cm.addEventListener("popupshowing", this, false);
		this.cm.addEventListener("popuphidden", this, false);
		this.pu.init();
		setTimeout(function(_this) {
			_this.showMenuitems();
			_this.showIcons();
			_this.setupPanelButton(true);
		}, 50, this);

		var renamed = { //= Deprecated since 2025-07-20
			toolsMi:    "miTools",
			toolsMiSub: "miToolsSub",
			appMi:      "miApp",
			panelBtn:   "tbbPanel"
		};
		for(var p in renamed) {
			(function(p, pn) {
				this.__defineGetter__(p, function() {
					this.ut.warning("linkPropsPlus." + p + " is deprecated, use linkPropsPlus." + pn + " instead");
					return this[pn];
				});
			}).call(this, p, renamed[p]);
		}
	},
	destroy: function() {
		window.removeEventListener("unload", this, false);
		this.cm.removeEventListener("popupshowing", this, false);
		this.cm.removeEventListener("popuphidden", this, false);
		this.setupPanelButton(false);
	},
	setupPanelButton: function(setup) {
		var tbbPanel = this.tbbPanel;
		if(tbbPanel) {
			var fn = setup ? tbbPanel.addEventListener : tbbPanel.removeEventListener;
			fn.call(tbbPanel, "dragover", this, false);
			fn.call(tbbPanel, "dragleave", this, false);
		}
	},
	handleEvent: function(e) {
		switch(e.type) {
			case "load":         this.init();                                                  break;
			case "unload":       this.destroy();                                               break;
			case "popupshowing": e.target == e.currentTarget && this.cmd.setContextMenu();     break;
			case "popuphidden":  e.target == e.currentTarget && this.cmd.destroyContextMenu(); break;
			case "dragover":     this.dnd.panelButtonDragOver(e);                              break;
			case "dragleave":    this.dnd.panelButtonDragLeave(e);
		}
	},

	$: function(id) {
		return document.getElementById(id);
	},
	get cm() {
		delete this.cm;
		return this.cm = this.$("contentAreaContextMenu")
			|| this.$("mailContext");
	},
	get mi() {
		delete this.mi;
		return this.mi = this.$("linkPropsPlus-contextMenuitem");
	},
	get miTools() {
		delete this.miTools;
		return this.miTools = this.$("linkPropsPlus-toolsMenuitem");
	},
	get miToolsSub() {
		delete this.miToolsSub;
		return this.miToolsSub = this.$("linkPropsPlus-toolsMenuitemSub");
	},
	get miApp() {
		delete this.miApp;
		return this.miApp = this.$("linkPropsPlus-appMenuitem");
	},
	get tbbPanel() {
		delete this.tbbPanel;
		return this.tbbPanel = "CustomizableUI" in window
			&& this.$("PanelUI-menu-button");
	},

	prefsChanged: function(pName, pVal) {
		if(pName.substr(0, 6) == "showIn")
			this.showMenuitems();
		else if(pName.substr(0, 5) == "icon.")
			this.showIcons();
	},
	showMenuitems: function() {
		var showTools = this.pu.get("showInToolsMenu");
		var showToolsSub = showTools
			&& this.miToolsSub
			&& this.pu.get("showInToolsMenuSub");
		this.miTools    && this.miTools   .setAttribute("hidden", !(showTools && !showToolsSub));
		this.miToolsSub && this.miToolsSub.setAttribute("hidden", !showToolsSub);
		this.miApp      && this.miApp     .setAttribute("hidden", !this.pu.get("showInAppMenu"));
	},
	showIcons: function() {
		const attr = "lpp_iconized";
		this.mi.setAttribute(attr, this.pu.get("icon.contextMenu"));
		var iconTools = this.pu.get("icon.toolsMenu");
		this.miTools    && this.miTools   .setAttribute(attr, iconTools);
		this.miToolsSub && this.miToolsSub.setAttribute(attr, iconTools);
		this.miApp      && this.miApp     .setAttribute(attr, this.pu.get("icon.appMenu"));
	}
};
window.addEventListener("load", linkPropsPlus, false);