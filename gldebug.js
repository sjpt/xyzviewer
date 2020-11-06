'use strict';

var gl, renderer, framenum, findval, oplist, opmode, serious, showbaderror;
const Gldebug = {
    stopframe: -999, action: undefined, ops: undefined,
    start: function startgldebug(opts = {}) {
        var action;
        if (opts === true) opts = {action: 'logerr'};
        if (typeof opts === 'object') {
            Gldebug.stopframe = framenum + opts.frames + 1;
            action = opts.action;
        }
        if (typeof opts === 'number') {
            Gldebug.stopframe = framenum + opts;
            action = undefined;
        }
        Gldebug.action = action;
        let glgl = opts.gl || Gldebug.gl || gl || (renderer && renderer.context);
        if (!glgl) {
            log('Gldebug, no context on which to start.');
            return;
            // below does not work,
            // We could operate globally on __proto__, but probably cleaner just not to support it.
            //const xxcanv = document.createElement('canvas');  // dummy just to get at glgl
            //glgl = xxcanv.getContext( 'webgl' ) || xxcanv.getContext( 'experimental-webgl' );
        }
        Gldebug.gl = glgl;
        if (glgl.old) { console.error("already debugging"); return; }
        if (!Gldebug.gllist) allglex(gl);

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
                            checkglerror("debug wrapped " + ff, undefined, arguments);
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

// compute Gldebug.gllist list of extensions
function allglex(glgl = Gldebug.gl) {
    Gldebug.gllist = [glgl];
    let exts = glgl.getSupportedExtensions();
    for (let i = 0; i < exts.length; i++) Gldebug.gllist.push(glgl.getExtension(exts[i]));
}

Gldebug.ops = {};

/** check for gl errors, with a choice of one or more actions (just a concatenated string)
logerr: (default) log errors
logall: log all
breakerr: break on errors
breakall: break on every call
*/
function checkglerror(msg, action = undefined, args = undefined) {
    if (framenum >= Gldebug.stopframe) {Gldebug.stop(); return; }
    let lgl = Gldebug.gl;
    let rc = lgl.getError();
    let errmsg = (rc) ? findval(lgl, rc) : 'OK';

    action = action || Gldebug.action || 'logerr';
    if (args) {
        msg += "  (" + [].slice.call(args).join(", ").substring(0, 50) + ")";
    }

    if (action.indexOf('logall') !== -1)
        log(framenum, ">> gl" + msg + "            " + errmsg[0] + " (" + rc + " 0x" + rc.toString(16) + ")");
    if (action.indexOf('breakallall') !== -1)
        debugger;

    if (rc) {
        if (action.indexOf('logerr') !== -1)
            console.error(framenum, ">> gl error " + errmsg[0] + " (" + rc + " 0x" + rc.toString(16) + ") in " + msg + '  opmode=' + opmode + ' ' + oplist[opmode]);
        if (action.indexOf('breakerr') !== -1)
            debugger;
        if (action.indexOf('seriouserr') !== -1)
            serious(msg);
    }

    if (rc === lgl.CONTEXT_LOST_WEBGL) {
        showbaderror("WebGL context lost ~ you will probably need to refresh.");
    }
    return rc;
}

var log;
if (!log) log = console.log;
