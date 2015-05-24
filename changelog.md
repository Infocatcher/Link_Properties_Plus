#### Link Properties Plus: Changelog

`+` - added<br>
`-` - deleted<br>
`x` - fixed<br>
`*` - improved<br>

##### master/HEAD
`+` Added support for “X-Archive-Orig-Last-Modified” header (used on <a href="http://archive.org/">archive.org</a>).<br>
`x` Corrected handling of links like `private:///#http://example.com/` from <a href="https://addons.mozilla.org/addon/private-tab/">Private Tab</a> extension.<br>
`+` Added displaying of resume download ability (in status field) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/4">#4</a>).<br>
`+` Added Ctrl+Shift+C hotkey to open context menu for current row (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/5">#5</a>).<br>
`+` All keyboard shortcuts now configurable (<em>extensions.linkPropertiesPlus.key.</em>* preferences) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/6">#6</a>).<br>
`*` Experimental: block Escape key directly after request finished to not accidentally close dialog instead of canceling request (<em>extensions.linkPropertiesPlus.blockEscapeKeyDelay</em> preference).<br>
`*` Improved HTTP headers field: now used formatting and sections are collapsable (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/8">#8</a>, <a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/9">#9</a>).<br>
`*` Changed extension icon (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/10">#10</a>).<br>
`+` Added toolbar button (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/11">#11</a>).<br>
`*` Improved URLs detection is selection: now detects `about:`, but ignores `http:`, `http://` and `file:///`.<br>
`+` Added support for separate message window in Thunderbird and SeaMonkey's mail (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/12">#12</a>).<br>
`x` Correctly focus already opened link properties window with the same URI and referer, if URI is empty.<br>
`+` Added ability to not use selection clipboard on Linux to prefill link in properties window (<em>extensions.linkPropertiesPlus.preferSelectionClipboard</em> preference).<br>
`+` Added basic indication of request errors (only in link properties window): invalid URI or request error – red “Get properties” button, protocol with URI_DOES_NOT_RETURN_DATA flag or unknown protocol – gray “Get properties” button.<br>
`*` Show request headers modifications from browser or other extensions (hidden preference <em>extensions.linkPropertiesPlus.showRequestHeadersDiff</em> to highlight changed headers) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/13">#13</a>).<br>
`*` Middle-click on any menu item (and on toolbar button) to automatically start request with URL from clipboard.<br>
`*` Double-click on “Referer:” label (or on empty referer field) to get fake referer from link.<br>
`*` Open links after source tab only if <em>extensions.linkPropertiesPlus.openInChildTab</em> = true, also added <em>extensions.linkPropertiesPlus.openInChildTab.onlyIfSelected</em> preference to open in sibling tab only if source tab is still selected.<br>
`x` Corrected localization for numbers and dates (<em>extensions.linkPropertiesPlus.localeNumbers</em> and <em>extensions.linkPropertiesPlus.localeDates</em> preferences) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/15">#15</a>).<br>
`+` Added ability to save maximized state of properties window.<br>
`+` Properties window: added hotkey to toggle full screen mode (F11).<br>
`*` Implemented ability to drag link into button, that placed inside Australis menu-button (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/16">#16</a>).<br>
`x` Correctly handle about:* URIs in Firefox 36+.<br>
`*` Improved support of Electrolysis (multi-process mode).<br>
`*` Improved detection of selected text links (preferences: <em>extensions.linkPropertiesPlus.context.onSelection.ignoreSpaces</em>, <em>extensions.linkPropertiesPlus.context.onSelection.detectionThreshold</em>).<br>
`+` Added ability to send GET request instead of HEAD (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/14">#14</a>).<br>
`*` Double-click on “Link:” label (or on empty link field) to paste URI from clipboard.<br>
`x` Fixed compatibility with future Firefox versions (bug <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1090880">1090880</a>, <a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/18">#18</a>).<br>

##### 1.5.2 (2013-04-06)
`x` Corrected position of context menu item in SeaMonkey's mail.<br>
`*` Now used platform-specific line breaks to copy multiline text to clipboard.<br>
`+` Added ability to detect selected links in input fields (<em>extensions.linkPropertiesPlus.context.onSelection.inInputFields</em> preference).<br>
`+` Added <em>extensions.linkPropertiesPlus.ownWindow.cropFileNameInTitle</em> preference to crop too long file names in window title (or hide it at all).<br>
`+` Now fully compatible with per-window private browsing (include support for <a href="https://addons.mozilla.org/addon/private-tab/">Private Tab</a> extension) (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/1">#1</a>).<br>
`+` Added tooltip with all redirects to “Direct Link” input field (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/2">#2</a>).<br>
`x` Fixed position of item in Tools menu in latest Firefox Nightly.<br>
`*` Minor optimizations and improvements.<br>

##### 1.5.1 (2013-01-07)
`x` Fixed fallback save method in Firefox 20.0a1.<br>
`*` Improved handling of HTTP referers:<br>
&emsp;&emsp;`*` “Internal” and file:// links now never used as referers (but you still can manually set any referer).<br>
&emsp;&emsp;`*` Improved handling of built-in <em>network.http.sendRefererHeader</em> preference: now “Referer:” field shows real value (instead of old "internal" handling).<br>
&emsp;&emsp;`+` Added <em>extensions.linkPropertiesPlus.useFakeReferer.force</em> preference to use fake referer, if rererefs sending was disabled using <em>network.http.sendRefererHeader</em>.<br>
&emsp;&emsp;`+` Added <em>extensions.linkPropertiesPlus.useRealRefererForTextLinks</em> preference to send real referers for text links.<br>
`*` Improved startup performance for main application window.<br>
`*` Used built-in function to read text from clipboard + added changes for <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=463027">"Implement per-window Private Browsing"</a> bug.<br>
`+` Added possibility to load bypass cache: Shift+Enter or Shift+click/middle-click on “Get properties” button.<br>
`*` Small internal improvements.<br>

##### 1.5.0.2 (2013-01-05)
`*` No longer use <a href="https://developer.mozilla.org/en-US/docs/Extensions/Updating_extensions_for_Firefox_4#XPI_unpacking">internal JAR archive</a>.<br>
`x` In some cases “Apply” button in options dialog was remained incorrectly disabled or enabled.<br>

##### 1.5.0.1 (2013-01-04)
`+` Added French locale (fr), thanks to <a href="https://addons.mozilla.org/user/1763345/">Calimero988</a>.<br>

##### 1.5.0 (2013-01-02)
`*` Published on <a href="https://addons.mozilla.org/">AMO</a>.<br>

##### Older versions
<a title="Available only in Russian, sorry" href="https://translate.google.com/translate?sl=ru&tl=en&u=http%3A%2F%2Finfocatcher.ucoz.net%2Fext%2Ffx%2Fext_link_props%2Fchangelog.txt">changelog.txt</a>