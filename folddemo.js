/** dynamic expansion, todo add easier scripting */

let {orbcamera, gui} = window;

export function folddemo(tt = 10000, gap = 2000) {
    if (!ranges || !ranges.atom) {
        posturiasync('data/4bcufullCA.pdb',
            (d,f) => { pdbReader(d,f); folddemo(); });
        spotsize(5);
        return;
    }
    orbcamera.position.set(0,0,250);
    fullcanvas(true);

    if (!folddemo.st) requestAnimationFrame(foldframe);
    folddemo.st = Date.now();
    function foldframe() {
        const t = Date.now() - folddemo.st;
        if (t > 2 * tt + gap) { expandchain(0,0); folddemo.st = undefined; return; }
        if (t < tt) {
            const dt = t / tt;
            expandchain(0.5 + 0.5 * dt, 0.5 - 0.5 * dt);
        } else if (t > tt + gap) {
            const dt = (t - tt - gap) / tt;
             expandchain(1-dt, 0);
        }
        requestAnimationFrame(foldframe);
    }
}

var expbutton = document.createElement('button');
gui.appendChild(expbutton);
expbutton.textContent = 'fold demo';
expbutton.onclick = () => folddemo();
