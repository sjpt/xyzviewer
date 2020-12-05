// main file for code that needs to run early
window.lastModified.main = `Last modified: 2020/12/03 17:11:10
`

// @ts-ignore
var W = window;
// @ts-ignore
var E = window;
// @ts-ignore
var X = window;

console.log('main.js execute, window W set', W.closed, E.colourpick.value, X.raywidth);

/** log function shared for shorthand, also allows console.log to change as Edge brings up/closes developer tools */
var log;
log = function() {
    console.log.apply(console, arguments);
}
log('main.js initial log established');

// /** convenience function for a few standard colours (integer based) */
// // eslint-disable-next-line no-unused-vars
// function icol(k) {
// 	let cols = [col 3(0.5,0.5,0.5), col 3(1,0,0), col 3(0,1,0), col 3(1,1,0), col 3(0,0,1), col 3(1,0,1), col 3(0,1,1), col 3(1,1,1)];
// 	let col = cols[Math.round(k)];
// 	if (!col) col = cols[0];
// 	return col.clone();
// }

// /** create node from html string */
// function nodeFromHTML(html) {
// 	const t = document.createElement('div'); // using template did not yield a firstElementChild
// 	t.innerHTML = html.trim('');
// 	return t.firstElementChild;
// }

// /** append node from html, used in archaeology version */
// // eslint-disable-next-line no-unused-vars
// function appendNodeFromHTML(parent, html) {
// 	parent.appendChild(nodeFromHTML(html));
// }

