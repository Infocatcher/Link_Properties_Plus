var linkPropsPlusPrefUtils = {
	prefNS: "extensions.linkPropertiesPlus.",
	prefVer: 2,

	get prefSvc() {
		delete this.prefSvc;
		return this.prefSvc = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService)
			.QueryInterface(Components.interfaces.nsIPrefBranch2 || Components.interfaces.nsIPrefBranch);
	},

	init: function() {
		window.addEventListener("unload", this, false);
		var v = this.pref("prefsVersion") || 0;
		if(v < this.prefVer)
			this.prefsMigration(v);
		this.registerHotkeys();
		this.prefSvc.addObserver(this.prefNS, this, false);
	},
	destroy: function() {
		window.removeEventListener("unload", this, false);
		this.prefSvc.removeObserver(this.prefNS, this);
	},
	handleEvent: function(e) {
		if(e.type == "unload")
			this.destroy();
	},

	// Preferences observer:
	observe: function(subject, topic, pName) {
		if(topic != "nsPref:changed")
			return;
		pName = pName.substr(this.prefNS.length);
		["linkPropsPlusSvc", "linkPropsPlus", "linkPropsPlusWnd", "linkPropsPlusOpts"].forEach(
			function(p) {
				if(!(p in window))
					return;
				var o = window[p];
				if(o.hasOwnProperty("prefsChanged"))
					o.prefsChanged(pName);
			}
		);
	},

	pref: function(pName, pVal) {
		pName = this.prefNS + pName;
		if(arguments.length == 1)
			return this.getPref(pName);
		return this.setPref(pName, pVal);
	},
	getPref: function(pName, defaultVal) {
		var ps = this.prefSvc;
		switch(ps.getPrefType(pName)) {
			case ps.PREF_STRING: return ps.getComplexValue(pName, Components.interfaces.nsISupportsString).data;
			case ps.PREF_INT:    return ps.getIntPref(pName);
			case ps.PREF_BOOL:   return ps.getBoolPref(pName);
			default:             return defaultVal;
		}
	},
	setPref: function(pName, pVal) {
		var ps = this.prefSvc;
		var pType = ps.getPrefType(pName);
		var isNew = pType == ps.PREF_INVALID;
		var vType = typeof pVal;
		if(pType == ps.PREF_BOOL || (isNew && vType == "boolean"))
			ps.setBoolPref(pName, pVal);
		else if(pType == ps.PREF_INT || (isNew && vType == "number"))
			ps.setIntPref(pName, pVal);
		else if(pType == ps.PREF_STRING || isNew) {
			var ss = Components.interfaces.nsISupportsString;
			var str = Components.classes["@mozilla.org/supports-string;1"]
				.createInstance(ss);
			str.data = pVal;
			ps.setComplexValue(pName, ss, str);
		}
		return pVal;
	},

	prefsMigration: function(v) {
		var ps = this.prefSvc;
		if(v < 1) {
			// Inherit preferences of original Extended Link Properties
			var pName = "extensions.extendedlink.showhttpheader";
			var pVal = this.getPref(pName, false);
			this.pref("properties.showHttpHeaders", pVal);
			this.pref("download.showHttpHeaders", pVal);
			this.pref("ownWindow.showHttpHeaders", pVal);
			ps.deleteBranch(pName);

			pName = "extensions.extendedlink.sizePrecision";
			pVal = this.getPref(pName, 2);
			if(typeof pVal != "number")
				pVal = 2;
			this.pref("sizePrecision", pVal);
			ps.deleteBranch(pName);
		}
		if(v < 2) {
			// Inherit preferences of modified Extended Link Properties
			// Move prefs from "extensions.extlinkprops." to "extensions.linkPropertiesPlus." branch:
			var oldBranch = "extensions.extlinkprops.";
			ps.getBranch(oldBranch)
				.getChildList("", {})
				.forEach(function(pName) {
					var oldName = oldBranch + pName;
					this.pref(pName, this.getPref(oldName));
					ps.clearUserPref(oldName);
				}, this);
		}
		this.pref("prefsVersion", this.prefVer);
		setTimeout(function() { // Try don't block main thread
			ps.savePrefFile(null);
		}, 0);
	},

	// Hotkeys:
	registerHotkeys: function() {
		this.prefSvc.getBranch(this.prefNS + "key.")
			.getChildList("", {})
			.forEach(this.registerHotkey, this);
	},
	registerHotkey: function(kId) {
		var kElt = document.getElementById("linkPropsPlus-key-" + kId);
		if(!kElt)
			return;
		var keyStr = this.pref("key." + kId);
		if(!keyStr) { // Key is disabled
			// Strange things may happens without this for <key command="..." />
			kElt.parentNode.removeChild(kElt);
			return;
		}
		var tokens = keyStr.split(" ");
		var key = tokens.pop() || " ";
		var modifiers = tokens.join(",");
		kElt.removeAttribute("disabled");
		kElt.setAttribute(key.indexOf("VK_") == 0 ? "keycode" : "key", key);
		kElt.setAttribute("modifiers", modifiers);
	}
};