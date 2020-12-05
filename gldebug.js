'use strict';

// var gl, renderer, framenum;
var WA;
const Gldebug = {
    // compute Gldebug.gllist list of extensions
    allglex: function(glgl = Gldebug.gl) {
        Gldebug.gllist = [glgl];
        let exts = glgl.getSupportedExtensions();
        for (let i = 0; i < exts.length; i++) Gldebug.gllist.push(glgl.getExtension(exts[i]));
    },

    stopframe: -999, action: undefined, ops: undefined,
    start: function startgldebug(opts = {}) {
        var action;
        if (opts === true) opts = {action: 'logerr'};
        if (typeof opts === 'object') {
            Gldebug.stopframe = WA.framenum + opts.frames + 1;
            action = opts.action;
        }
        if (typeof opts === 'number') {
            Gldebug.stopframe = WA.framenum + opts;
            action = undefined;
        }
        Gldebug.action = action;
        let glgl = opts.gl || Gldebug.gl || WA.gl || (WA.renderer && WA.renderer.getContext());
        if (!glgl) {
            console.error('Gldebug, no context on which to start.');
            return;
            // below does not work,
            // We could operate globally on __proto__, but probably cleaner just not to support it.
            //const xxcanv = document.createElement('canvas');  // dummy just to get at glgl
            //glgl = xxcanv.getContext( 'webgl' ) || xxcanv.getContext( 'experimental-webgl' );
        }
        Gldebug.gl = glgl;
        if (glgl.old) { console.error("already debugging"); return; }
        if (!Gldebug.gllist) Gldebug.allglex(glgl);

        // iterate over basic gl + all extensions
        let ggl;
        for (let i = 0; i < Gldebug.gllist.length; i++) {
            ggl = Gldebug.gllist[i];
            ggl.old = {};
            for (let f in ggl) {  // iterate over functions within ggl
                if (typeof ggl[f] === "function" && f !== "getError") {
                    ggl.old[f] = ggl[f];
                    (function (ff, of, ggll) {
                        ggll[ff] = function () {
                            let r = of.apply(ggll, arguments);
                            Gldebug.ops[ff] = (Gldebug.ops[ff] || 0) + 1;
                            Gldebug.checkglerror("debug wrapped " + ff, undefined, arguments);
                            return r;
                        };
                        //ggl[ff].name = 'wrapped_' + ff; // invalid
                    })(f, ggl[f], ggl);
                }
            }
        }
    },
    stop: () => { },
    frame: (frames = 1) => Gldebug.start({frames, action: 'logall'})
}

/** remove debug wrapper for gl */
Gldebug.stop = function (ggl = Gldebug.gl) {
    if (!ggl.old) { console.error("not currently debugging"); return; }
    for (let i = 0; i < Gldebug.gllist.length; i++) {
        let ggll = Gldebug.gllist[i];
        for (let f in ggll.old) {
            ggll[f] = ggll.old[f];
        }
        ggll.old = undefined;
    }
}


Gldebug.ops = {};

/** check for gl errors, with a choice of one or more actions (just a concatenated string)
logerr: (default) log errors
logall: log all
breakerr: break on errors
breakall: break on every call
*/
Gldebug. checkglerror = function(msg, action = undefined, args = undefined) {
    /** find exact value in object, return (list of) keys */
    function findval(obj, val) {
        var s = [];
        for (var n in obj) if (obj[n] === val) s.push(n);
        return s;
    }

    if (WA.framenum >= Gldebug.stopframe) {Gldebug.stop(); return; }
    let lgl = Gldebug.gl;
    let rc = lgl.getError();
    let errmsg = (rc) ? findval(lgl, rc) : 'OK';

    action = action || Gldebug.action || 'logerr';
    if (args) {
        msg += "  (" + [].slice.call(args).join(", ").substring(0, 50) + ")";
    }

    if (action.indexOf('logall') !== -1)
        console.log(WA.framenum, ">> gl" + msg + "            " + errmsg[0] + " (" + rc + " 0x" + rc.toString(16) + ")");
    if (action.indexOf('breakallall') !== -1)
        // eslint-disable-next-line no-debugger
        debugger;

    if (rc) {
        if (action.indexOf('logerr') !== -1)
            console.log(WA.framenum, ">> gl error " + errmsg[0] + " (" + rc + " 0x" + rc.toString(16) + ") in " + msg);
        if (action.indexOf('breakerr') !== -1)
            // eslint-disable-next-line no-debugger
            debugger;
    }

    if (rc === lgl.CONTEXT_LOST_WEBGL) {
        console.error("WebGL context lost ~ you will probably need to refresh.");
    }
    return rc;
}
