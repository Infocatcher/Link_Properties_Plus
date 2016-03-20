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
	},
	destroy: function() {
		window.removeEventListener("unload", this, false);
		this.cm.removeEventListener("popupshowing", this, false);
		this.cm.removeEventListener("popuphidden", this, false);
		this.setupPanelButton(false);
	},
	setupPanelButton: function(setup) {
		var panelBtn = this.panelBtn;
		if(panelBtn) {
			var fn = setup ? panelBtn.addEventListener : panelBtn.removeEventListener;
			fn.call(panelBtn, "dragover", this, false);
			fn.call(panelBtn, "dragleave", this, false);
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
	get toolsMi() {
		delete this.toolsMi;
		return this.toolsMi = this.$("linkPropsPlus-toolsMenuitem");
	},
	get toolsMiSub() {
		delete this.toolsMiSub;
		return this.toolsMiSub = this.$("linkPropsPlus-toolsMenuitemSub");
	},
	get appMi() {
		delete this.appMi;
		return this.appMi = this.$("linkPropsPlus-appMenuitem");
	},
	get panelBtn() {
		delete this.panelBtn;
		return this.panelBtn = "CustomizableUI" in window
			&& this.$("PanelUI-menu-button");
	},

	prefsChanged: function(pName, pVal) {
		if(pName.indexOf("showIn") == 0)
			this.showMenuitems();
		else if(pName.indexOf("icon.") == 0)
			this.showIcons();
	},
	showMenuitems: function() {
		var showTools = this.pu.get("showInToolsMenu");
		var showToolsSub = showTools
			&& this.toolsMiSub
			&& this.pu.get("showInToolsMenuSub");
		this.toolsMi    && this.toolsMi   .setAttribute("hidden", !(showTools && !showToolsSub));
		this.toolsMiSub && this.toolsMiSub.setAttribute("hidden", !showToolsSub);
		this.appMi      && this.appMi     .setAttribute("hidden", !this.pu.get("showInAppMenu"));
	},
	showIcons: function() {
		const attr = "lpp_iconized";
		this.mi.setAttribute(attr, this.pu.get("icon.contextMenu"));
		var iconTools = this.pu.get("icon.toolsMenu");
		this.toolsMi    && this.toolsMi   .setAttribute(attr, iconTools);
		this.toolsMiSub && this.toolsMiSub.setAttribute(attr, iconTools);
		this.appMi      && this.appMi     .setAttribute(attr, this.pu.get("icon.appMenu"));
	}
};
window.addEventListener("load", linkPropsPlus, false);