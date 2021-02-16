// patch xyzviewer into another program, in particular MLV
//
// see comments in https://docs.google.com/document/d/18CteOxpaPWIA2zRnd3FJBw5ybBWwSESFct4IEoE6Hyw/edit#heading=h.1eek8clfzs4s

/*
patchxyz itself does not load significant xyz code, so can be imported with very little overhead
For patching MLV it is loaded from the conditional breakpoint;
and then register() arranges to capture keystroke '3'
and the keystroke then calls makexyz() which converts scatterplot to xyz
 
The code loading (xyzviewer + support such as THREE) is done by init() on the first call to makexyz().
*/

/* for CORS, to get it to work with remote xyz version different from MLV
run
%LOCALAPPDATA%\Google\Chrome SxS\Application\chrome.exe"  --disable-web-security --user-data-dir=%temp%\mlvxyz

no need for local xyz version served from our server, it allows CORS

// in graph.js after 'class WGLScatterPlot extends WGLChart{' ... 'self = this;'
// set localStorage and add conditional breakpoint as below

localStorage.loc = 'http://localhost:8800/,,/xyz/'
localStorage.loc = 'https://csynth.molbiol.ox.ac.uk/csynthstatic/xyz/'

// breakpoint code
loc = localStorage.loc; 
import(loc + 'patchxyz.js').then(x => x.register(loc, self)); 
console.log('importing', div)


Also capture (most, not all) fields at graph.js 180 setColumns()

*/
export {register, init, makexyz, awaitGGLoaded}

// set up the window proxies used by the rest of xyzviewer
// @ts-ignore
window.W = window; window.E = window; window.X = window; window.WA = window;

const {E} = window;

console.log('patchxyz.js execute, window W set');

// init called lazily once on first intercept, to load up all the xyz code, and then perform intercept
async function init(loc = 'https://csynth.molbiol.ox.ac.uk/csynthstatic/xyz/') {
    const GG = window.GG;   // this gives access to various parts of xysviewer
    if (initdone) return await awaitGGLoaded(); // first time in has initialized it, but we must wait till that one is ready

    initdone = true;
    const hh = await(await fetch(loc + 'xyz.html')).text();

    // extract the gui body from the html file and insert into running file, hidden by default
    // we need the gui in the short term (even if hidden) as filter
    const guibody = hh.split('<body>')[1].split('</body>')[0];
    const guidiv = document.createElement('div');
    guidiv.innerHTML = guibody;
    guidiv.style.display = 'none';
    document.body.appendChild(guidiv);
    guidiv.id = 'xyzviewergui';
    guidiv.style.display = 'none';
    guidiv.style.position = 'absolute';
    guidiv.style.right = '0%';
    guidiv.style.top = '0%';
    guidiv.style.background = 'rgba(40,40,40,255)';
    guidiv.style.zIndex = '99999';

    // extract the style sheet from the html file and insert into running file
    // n.b. this can have typical nasty css side-effects
    let style = hh.split('<style>')[1].split('</style>')[0];
    style = style.replace('body {', 'xbody {')
    const sdiv = document.createElement('style');
    sdiv.innerHTML = style + '\n#xyzviewergui * {background: rgba(120,120,120,255); opacity: 1}';
    document.head.appendChild(sdiv);
    
    // these js files are not currently implemented as modules so must be loaded as scripts
    await addscript(loc + "jsdeps/three121.js")
    await addscript(loc + "jsdeps/stats.min.js")
    await addscript(loc + "jsdeps/js-yaml.js")
    await addscript(loc + "jsdeps/math.js")

    // const bbb = await import(loc + 'basic.js');

    window.addEventListener('GGLoaded', ()=>ggloaded = true);
    // importing graphicsboiler will import all of the xyz files
    // it will also set up renderer, etc
    await import(loc + 'graphicsboiler.js');

    await awaitGGLoaded();
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }  // permit await sleep(xxx)
let initdone, ggloaded;
async function awaitGGLoaded() { 
    while (!ggloaded) {await sleep(100)}
}

// intercept the captured pane and convert it to xyz object: capturing done by breakpoint for now
// plotobj holds the 'donor' object, from which we can extract data, columns, etc
async function makexyz(loc, plotobj) {
    const GG = window.GG;   // this gives access to various parts of xysviewer
    GG.plotobj = plotobj; GG.ndx = plotobj.ndx; // for debug poking
    await init(loc);

    // create a XYZ object and populate it with the captured data
    let hhh;
    /* * @type {XYZ} */ let xyzobj;  // don't use types while this is patch
    xyzobj = new GG.xyz.XYZ(undefined, 'fromMLV', true); // true
    xyzobj.useJson(plotobj.ndx.getOriginalData());

    // find the captured div, and display the domElement inside it
    hhh = plotobj.div[0];
    // window.hhh = hhh;               // debug
    const ch = hhh.children;
    for (let i = 0; i < ch.length; i++) {
        if (ch[i].className !== 'mlv-chart-label')
            ch[i].style.display = 'none';
    }

    const cols = plotobj.config.param;
    xyzobj.setField('X', cols[0], false);
    xyzobj.setField('Y', cols[1], false);
    xyzobj.setField('Z', 'field35', false);
    xyzobj.setColor(plotobj.config.color_by.column.id, false);

 
    xyzobj.setHostDOM(hhh);
    const gb = xyzobj.gb;
    // now done by setHostDOM
    // const renderer = gb.renderer;
    // hhh.addEventListener('resize', gb.onWindowResize);
    // gb.onWindowResize();
    // renderer.domElement.style.zIndex = 999;
    // renderer.domElement.style.position = 'relative';
    // // give access to our GUI, toggled by double-click on our canvas
    // renderer.domElement.ondblclick = () => E.xyzviewergui.style.display = E.xyzviewergui.style.display ? '' : 'none';

    // set up some sensible view etc
    gb.plan();
    // gb.orbcamera.position.set(0,0,3); // leave to default
    xyzobj.setPointSize(0.01)

    xyzobj.onFilter(ids => {
        plotobj.dim.filter(function(d){ return ids[d]; }); 
        const xids = plotobj.dim.getIds(); 
        plotobj.updateListener(xids,plotobj.config.id);
    });

    // handle incoming crossfilter
    plotobj._filter = ids => xyzobj.filter(ids); // ???
    plotobj._hide = ids => xyzobj.hide(ids);

    // colour change (field name only supported)
    plotobj.colorByField = param => {
        if (param)
                xyzobj.setColor(param.column.id);
    }

    // point size
    plotobj.setPointRadius = v => xyzobj.setPointSize(v/10);

}

/** register a WGLScatterPlot object for interception, sp is the WGLScatterPlot object */
function register(loc, sp) {
    const div = sp.div[0];
    console.log('registering', div.id, 'use 3 key to convert to xyzviewer', loc);
    sp.div[0].tabIndex = 0;
    sp.div[0].addEventListener('keydown', async (e) => {
        if (e.key === '3') {
            makexyz(loc, sp);
        }
    });
}

// a few globals used in xyzviewer, will get cleaned up at some point ....
window.GG = {};
window.foldStates = {};
window.lastModified = {};
/** toggle fold state, and remember it */
window.toggleFold = function(e) {
    if (e instanceof MouseEvent)
        e = e.target;  // might be called with event or with element
    var pn = e.parentNode;
    if (pn.classList.contains('hidebelow'))
        pn.classList.remove('hidebelow');
    else
        pn.classList.add('hidebelow');
    if (pn.id) {
        window.foldStates[pn.id] = pn.classList.contains('hidebelow');
        // localStorageSet("foldStates", foldStates);
    }
}

/** add a script dynamically */
// eslint-disable-next-line no-unused-vars
// this can support modules, but better just use import() instead
function addscript(src, type = 'text/javascript') {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = type;
    script.src = src;
    head.appendChild(script);

    return new Promise(resolve => {
        script.onload = () => {
            resolve();
        }
    });
}

// arrange for F10 to make any chart fullscreen
// (works for patchxyz, but independent)    
let mouseev;
document.addEventListener('mousemove', e => mouseev = e)
document.addEventListener('keydown', e => {
    if (e.key !== 'F10') return;
    if (document.fullscreenElement) return document.exitFullscreen();
    let div = document.elementFromPoint(mouseev.clientX, mouseev.clientY);
    while (!div.classList.contains('grid-stack-item-content')) {
        div = div.parentElement;
        if (!div) return;
    }
    div.requestFullscreen();
});
