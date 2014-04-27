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
`+` Added support for separate message window in Thunderbird and SeaMonkey's mail (<a href="https://github.com/Infocatcher/Link_Properties_Plus/issues/12">#12</a>).<br>
`x` Correctly focus already opened link properties window with the same URI and referer, if URI is empty.<br>
`+` Added ability to not use selection clipboard on Linux to prefill link in properties window (<em>extensions.linkPropertiesPlus.preferSelectionClipboard</em> preference).<br>
`+` Added basic indication of request errors (only in link properties window): invalid URI or request error – red “Get properties” button, protocol with URI_DOES_NOT_RETURN_DATA flag or unknown protocol – gray “Get properties” button.<br>
`*` Show request headers modifications from browser or other extensions.<br>
`+` Added support for App button from <a href="https://addons.mozilla.org/addon/classicthemerestorer/">Classic Theme Restorer</a> extension in Firefox 29+ (Australis).<br>
`*` Double click on “Referer:” label (or on empty referer field) to get fake referer from link.<br>

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