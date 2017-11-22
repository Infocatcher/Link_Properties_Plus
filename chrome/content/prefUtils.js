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
		var v = this.get("prefsVersion") || 0;
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

		var shortName = pName.substr(this.prefNS.length);
		var val = this._prefs[shortName] = this.getPref(pName);
		["linkPropsPlusSvc", "linkPropsPlus", "linkPropsPlusWnd", "linkPropsPlusOpts"].forEach(
			function(p) {
				if(!(p in window))
					return;
				var o = window[p];
				if(o.hasOwnProperty("prefsChanged"))
					o.prefsChanged(shortName, val);
			}
		);
	},

	_prefs: { __proto__: null },
	get: function(pName, defaultVal) {
		var cache = this._prefs;
		return pName in cache
			? cache[pName]
			: (cache[pName] = this.getPref(this.prefNS + pName, defaultVal));
	},
	set: function(pName, val) {
		return this.setPref(this.prefNS + pName, val);
	},
	getPref: function(pName, defaultVal, prefBranch) {
		var ps = prefBranch || this.prefSvc;
		switch(ps.getPrefType(pName)) {
			case ps.PREF_BOOL:   return ps.getBoolPref(pName);
			case ps.PREF_INT:    return ps.getIntPref(pName);
			case ps.PREF_STRING:
				if("getStringPref" in ps) // Firefox 58+
					return ps.getStringPref(pName);
				return ps.getComplexValue(pName, Components.interfaces.nsISupportsString).data;
		}
		return defaultVal;
	},
	setPref: function(pName, val, prefBranch) {
		var ps = prefBranch || this.prefSvc;
		var pType = ps.getPrefType(pName);
		if(pType == ps.PREF_INVALID)
			pType = this.getValueType(val);
		switch(pType) {
			case ps.PREF_BOOL: return ps.setBoolPref(pName, val);
			case ps.PREF_INT:  return ps.setIntPref(pName, val);
			case ps.PREF_STRING:
				if("setStringPref" in ps) // Firefox 58+
					return ps.setStringPref(pName, val);
				var ss = Components.interfaces.nsISupportsString;
				var str = Components.classes["@mozilla.org/supports-string;1"]
					.createInstance(ss);
				str.data = val;
				return ps.setComplexValue(pName, ss, str);
		}
	},
	getValueType: function(val) {
		switch(typeof val) {
			case "boolean": return this.prefSvc.PREF_BOOL;
			case "number":  return this.prefSvc.PREF_INT;
		}
		return this.prefSvc.PREF_STRING;
	},
	resetPref: function(pName) {
		var ps = this.prefSvc;
		if(ps.prefHasUserValue(pName))
			ps.clearUserPref(pName);
	},

	prefsMigration: function(v) {
		var ps = this.prefSvc;
		if(v < 1) {
			// Inherit preferences of original Extended Link Properties
			var pName = "extensions.extendedlink.showhttpheader";
			var pVal = this.getPref(pName, false);
			this.set("properties.showHttpHeaders", pVal);
			this.set("download.showHttpHeaders", pVal);
			this.set("ownWindow.showHttpHeaders", pVal);
			this.resetPref(pName);

			pName = "extensions.extendedlink.sizePrecision";
			pVal = this.getPref(pName, 2);
			if(typeof pVal != "number")
				pVal = 2;
			this.set("sizePrecision", pVal);
			this.resetPref(pName);
		}
		if(v < 2) {
			// Inherit preferences of modified Extended Link Properties
			// Move prefs from "extensions.extlinkprops." to "extensions.linkPropertiesPlus." branch:
			var oldBranch = "extensions.extlinkprops.";
			ps.getBranch(oldBranch)
				.getChildList("", {})
				.forEach(function(pName) {
					var oldName = oldBranch + pName;
					this.set(pName, this.getPref(oldName));
					this.resetPref(oldName);
				}, this);
		}
		this.set("prefsVersion", this.prefVer);
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
		var keyStr = this.get("key." + kId);
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