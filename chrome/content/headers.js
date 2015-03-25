try {
	// Binding for <button type="disclosure"> uses document.commandDispatcher.advanceFocus()/rewindFocus()
	var topWin = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		.getInterface(Components.interfaces.nsIWebNavigation)
		.QueryInterface(Components.interfaces.nsIDocShellTreeItem)
		.rootTreeItem
		.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
		.getInterface(Components.interfaces.nsIDOMWindow);
	if(topWin && topWin.document.commandDispatcher)
		document.commandDispatcher = topWin.document.commandDispatcher;
}
catch(e) {
	Components.utils.reportError(e);
}
function commandHandler(e) {
	var btn = e.target;
	if(btn.className == "twisty") {
		var show = btn.getAttribute("open") != "true";
		toggleTwisty(btn, show);
	}
}
function toggleTwisty(btn, show) {
	var block = btn.parentNode.nextSibling;
	var display = show ? "" : "none";
	block.style.display = display;
	var skipTestResume = document.body.hasAttribute("hideTestResume");
	if(skipTestResume) {
		var checkTestResume = function(node) {
			return /(?:^|\s)testResume(?:\s|$)/.test(node.className);
		};
		var isTestResume = checkTestResume(block);
	}
	for(var spacer = block.nextSibling; spacer; spacer = spacer.nextSibling) {
		if(skipTestResume && checkTestResume(spacer) != isTestResume)
			continue;
		if(/(?:^|\s)spacer(?:\s|$)/.test(spacer.className)) {
			spacer.style.display = display;
			break;
		}
	}
	btn.setAttribute("open", show);
}
window.addEventListener("command", commandHandler, true);
window.addEventListener("unload", function destroy(e) {
	window.removeEventListener("unload", destroy, false);
	window.removeEventListener("command", commandHandler, true);
	document.commandDispatcher = null;
}, false);

if(!Object.create) { // Firefox 3.6 and older
	// This workaround isn't optimal, but it's better than nothing (especially for too old browsers)
	var updTimer = 0;
	var forceDontCopyHiddenNode = function(node) {
		if(!(node instanceof Element))
			return;
		var hide = window.getComputedStyle(node, null).display == "none";
		if(hide == "__childNodes" in node)
			return;
		if(hide) {
			node.__childNodes = Array.slice(node.childNodes);
			node.textContent = "";
		}
		else {
			var df = document.createDocumentFragment();
			node.__childNodes.forEach(function(child) {
				df.appendChild(child);
			});
			delete node.__childNodes;
			node.appendChild(df);
		}
	};
	var forceDontCopyHiddenNodes = function() {
		if(!window.getComputedStyle(document.body, null)) { // Frame is hidden
			updTimer = setTimeout(forceDontCopyHiddenNodes, 2000);
			return;
		}
		Array.forEach(document.body.childNodes, function(node) {
			forceDontCopyHiddenNode(node);
			setTimeout(function() { // Pseudo async
				if(node.hasChildNodes())
					Array.forEach(node.childNodes, forceDontCopyHiddenNode);
			}, 0);
		});
	};
	var updProxy = function() {
		clearTimeout(updTimer);
		updTimer = setTimeout(forceDontCopyHiddenNodes, 50);
	};
	document.addEventListener("DOMNodeInserted", updProxy, false);
	document.addEventListener("DOMAttrModified", updProxy, false);
	window.addEventListener("unload", function destroy(e) {
		window.removeEventListener("unload", destroy, false);
		document.removeEventListener("DOMNodeInserted", updProxy, false);
		document.removeEventListener("DOMAttrModified", updProxy, false);
	}, false);
}