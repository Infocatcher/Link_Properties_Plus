// Description:
pref("extensions.linkPropertiesPlus@infocatcher.description", "chrome://linkpropsplus/locale/linkPropsPlus.properties");

pref("extensions.linkPropertiesPlus.properties.showResponseStatus", true);
pref("extensions.linkPropertiesPlus.properties.showHttpHeaders", false);
pref("extensions.linkPropertiesPlus.properties.showDirectURI", true);
pref("extensions.linkPropertiesPlus.download.showResponseStatus", true);
pref("extensions.linkPropertiesPlus.download.showHttpHeaders", false);
pref("extensions.linkPropertiesPlus.download.showDirectURI", false);
pref("extensions.linkPropertiesPlus.download.forceFakeURIHack", false);
pref("extensions.linkPropertiesPlus.ownWindow.showResponseStatus", true);
pref("extensions.linkPropertiesPlus.ownWindow.showHttpHeaders", false);
pref("extensions.linkPropertiesPlus.ownWindow.showDirectURI", true);
pref("extensions.linkPropertiesPlus.ownWindow.clickSelectsAll", true);

// For Thunderbird with useless internal mailbox:// URIs and Tools - Get file size...
// 0 - empty referer in case of "internal" URI
// 1 - use site root
// 2 - use same link
pref("extensions.linkPropertiesPlus.useFakeReferer", 1);

pref("extensions.linkPropertiesPlus.sizePrecision", 2);
pref("extensions.linkPropertiesPlus.useBinaryPrefixes", true);
pref("extensions.linkPropertiesPlus.decodeURIs", true);
pref("extensions.linkPropertiesPlus.closeAfterOpen", true);
pref("extensions.linkPropertiesPlus.showLinkButtons", 1); // 0 - don't show, 1 - hide, if direct link are the same, 2 - always show
pref("extensions.linkPropertiesPlus.openInChildTab", true);
pref("extensions.linkPropertiesPlus.openMultipleLimit", 5);

pref("extensions.linkPropertiesPlus.context.onLinks", true);
pref("extensions.linkPropertiesPlus.context.onSelection", true);
pref("extensions.linkPropertiesPlus.context.onSelection.cropLinkInLabel", 25); // 0 - don't show link in label
pref("extensions.linkPropertiesPlus.icon.contextMenu", true);

pref("extensions.linkPropertiesPlus.showInToolsMenu", true);
pref("extensions.linkPropertiesPlus.showInToolsMenuSub", false);
pref("extensions.linkPropertiesPlus.icon.toolsMenu", true);

pref("extensions.linkPropertiesPlus.showInAppMenu", true);
pref("extensions.linkPropertiesPlus.icon.appMenu", true);

pref("extensions.linkPropertiesPlus.autoClose.enabled", false);
pref("extensions.linkPropertiesPlus.autoClose.delay", 8000);
pref("extensions.linkPropertiesPlus.autoClose.dontCloseUnderCursor", true);
pref("extensions.linkPropertiesPlus.autoClose.onlyAfterRequest", true);

pref("extensions.linkPropertiesPlus.key.openWindow", "control alt s");

pref("extensions.linkPropertiesPlus.prefsVersion", 0);