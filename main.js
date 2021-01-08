// main file for code that needs to run early
window.lastModified.main = `Last modified: 2021/01/08 09:17:46
`

// @ts-ignore
var W = window, E = window, X = window, WA = window;

console.log('main.js execute, window W set', W.closed, E.colourpick.value, X.raywidth);


var foldStates = {}; // fold state structure, also saved as string in local storage
/** toggle fold state, and remember it */
function toggleFold(e) {
    if (e instanceof MouseEvent)
        e = e.target;  // might be called with event or with element
    var pn = e.parentNode;
    if (pn.classList.contains('hidebelow'))
        pn.classList.remove('hidebelow');
    else
        pn.classList.add('hidebelow');
    if (pn.id) {
        foldStates[pn.id] = pn.classList.contains('hidebelow');
        // localStorageSet("foldStates", foldStates);
    }
}

