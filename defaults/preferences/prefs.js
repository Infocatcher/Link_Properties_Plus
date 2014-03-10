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
pref("extensions.linkPropertiesPlus.ownWindow.cropFileNameInTitle", 50); // 0 - don't show file name in window title

pref("extensions.linkPropertiesPlus.useFakeReferer", 1);
// We don't use "internal" or file:// URIs as referers
// 0 - empty referer in case of "internal" or file:// URI
// 1 - use site root
// 2 - use the same link
pref("extensions.linkPropertiesPlus.useFakeReferer.force", true);
// Set fake referer header, if network.http.sendRefererHeader <= 1
pref("extensions.linkPropertiesPlus.useRealRefererForTextLinks", false);

pref("extensions.linkPropertiesPlus.preferSelectionClipboard", true);

pref("extensions.linkPropertiesPlus.showCaptionsInHttpHeaders", true);
// true  - always show captions like "Request:" and "Response:"
// false - show only captions about resumability tests

pref("extensions.linkPropertiesPlus.testDownloadResumability", true);
pref("extensions.linkPropertiesPlus.testDownloadResumability.download", false);
pref("extensions.linkPropertiesPlus.testDownloadResumability.alwaysShowMenuItem", false);
pref("extensions.linkPropertiesPlus.testDownloadResumability.showHttpHeaders", false);

pref("extensions.linkPropertiesPlus.sizePrecision", 2);
pref("extensions.linkPropertiesPlus.useBinaryPrefixes", true);
pref("extensions.linkPropertiesPlus.decodeURIs", true);
pref("extensions.linkPropertiesPlus.closeAfterOpen", true);
pref("extensions.linkPropertiesPlus.showLinkButtons", 1); // 0 - don't show, 1 - hide, if direct link are the same, 2 - always show
pref("extensions.linkPropertiesPlus.openInChildTab", true);
pref("extensions.linkPropertiesPlus.openMultipleLimit", 5);
pref("extensions.linkPropertiesPlus.blockEscapeKeyDelay", 450);
// Block Escape key directly after request finished (time in milliseconds) to don't close window instead of request cancellation

pref("extensions.linkPropertiesPlus.context.onLinks", true);
pref("extensions.linkPropertiesPlus.context.onSelection", true);
pref("extensions.linkPropertiesPlus.context.onSelection.inInputFields", true);
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

// Browser window:
pref("extensions.linkPropertiesPlus.key.openWindow", "control alt s");
// All windows with link properties:
pref("extensions.linkPropertiesPlus.key.goToURI", "control o");
pref("extensions.linkPropertiesPlus.key.goToDirectURI", "control shift o");
pref("extensions.linkPropertiesPlus.key.downloadURI", "control s");
pref("extensions.linkPropertiesPlus.key.downloadDirectURI", "control shift s");
pref("extensions.linkPropertiesPlus.key.contextMenu", "control shift c");
// Separate window:
pref("extensions.linkPropertiesPlus.key.closeOtherWindows", "shift VK_ESCAPE");

pref("extensions.linkPropertiesPlus.prefsVersion", 0);