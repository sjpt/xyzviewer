// main file for code that needs to run early
window.lastModified.main = `Last modified: 2020/11/06 17:42:41
`
var fileTypeHandlers; //  = {};
// eslint-disable-next-line no-unused-vars
function addFileTypeHandler(ftype, fun) {
    if (!fileTypeHandlers) fileTypeHandlers = {};
    fileTypeHandlers[ftype] = fun;
}

// eslint-disable-next-line no-unused-vars
var W,E,X, THREE;
W = E = X = window;
console.log('main.js execute, window W set', W);

/** log function shared for shorthand, also allows console.log to change as Edge brings up/closes developer tools */
function log() {
    console.log.apply(console, arguments);
}
log('main.js initial log established');


/** convenience function for rgb colour */
function col3(r, g=r, b=g) { return new THREE.Color().setRGB(r, g, b); }
// eslint-disable-next-line no-unused-vars
function hsv(h, s, v) { return new THREE.Color().setHSV(h, s, v); }
/** convenience function for a few standard colours (integer based) */
// eslint-disable-next-line no-unused-vars
function icol(k) {
	let cols = [col3(0.5,0.5,0.5), col3(1,0,0), col3(0,1,0), col3(1,1,0), col3(0,0,1), col3(1,0,1), col3(0,1,1), col3(1,1,1)];
	let col = cols[Math.round(k)];
	if (!col) col = cols[0];
	return col.clone();
}

/** create node from html string */
function nodeFromHTML(html) {
	const t = document.createElement('div'); // using template did not yield a firstElementChild
	t.innerHTML = html.trim('');
	return t.firstElementChild;
}

/** append node from html, used in archaeology version */
// eslint-disable-next-line no-unused-vars
function appendNodeFromHTML(parent, html) {
	parent.appendChild(nodeFromHTML(html));
}

/** add a script dynamically */
// eslint-disable-next-line no-unused-vars
function addscript(script) {
	const s = document.createElement('script');
	s.src = script;
	document.body.appendChild(s);
	// appendNodeFromHTML(document.body, `<script src="${script}"></script>`);
}
