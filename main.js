// main file for code that needs to run early
window.lastModified.main = `Last modified: 2022/09/01 10:43:35
`

// @ts-ignore
var W = window, E = window, X = window, WA = window;


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

// function gethtml () {
const html = /*html*/`
    <div id="xyzcontainer">
    <span id="lastmod"></span>
    <div id="gui" class="gui">
        <span>
            <b>speech: </b>
            <input type="checkbox" id="speechbox" onchange="GG.ospeech.isRunning=this.checked"/>
        </span>
        <span class="help" id="speechhelp">check for speech input</span>

        <span>
            <b>orbit controls: </b>
            <input type="checkbox" id="useorbcamera" onchange="currentXyz.gb.setOrbitController(this.checked)"/>
        </span>
        <span class="help" id="speechhelp">check for orbit controls,<br>trackball controls if not checked</span>

        <br>

        <span>
            <b>lasso: </b>
            <input type="checkbox" id="lassobox" onchange="currentXyz.gb.lasso.setrun(this.checked)"/>
        </span>
        <span class="help">check for lasso creation
            <br>normal mode is additive
            <br>alt key for subtractive
            <br>ctrl key for xor
        </span>

        <span>
            <button id="lassoclearbut" onclick="currentXyz.gb.lasso.clear(); lassobox.checked=false;">clear</button>
        </span>
        <span class="help">check for lasso creation
            <br>normal mode is additive
            <br>alt key for subtractive
            <br>ctrl key for xor
        </span>

        <span>
            <b>filter: </b>
            <input type="checkbox" id="lassofilterbox" onchange="currentXyz.gb.lasso.setFilter(this.checked)"/>
        </span>
        <span class="help">check lasso to work as filter on points
        </span>

        <span>
            <b>colour: </b>
            <input type="checkbox" id="lassocolourbox" onchange="currentXyz.gb.lasso.setColour(this.checked)"/>
        </span>
        <span class="help">check for lasso to apply colouring
        </span>

        <span>
            <b>use shader: </b>
            <input type="checkbox" id="lassoshaderbox" onchange="GG.lassoshader.useLassoShader(this.checked)"/>
        </span>
        <span class="help">use lasso shader for lasso implementation (w.i.p.)
        </span>

        <span>
            <b>xshader: </b>
            <input type="checkbox" id="xshaderbox" onchange="GG.xshader.useXShader(this.checked)"/>
        </span>
        <span class="help">use multidimensional shader (very much w.i.p.)
        </span>

        <span>
            <b>tumble: </b>
            l <input type="checkbox" id="tumbleboxl" onchange="GG.xshader.settumblerotl(this.checked * 0.005)"/>
            r <input type="checkbox" id="tumbleboxr" onchange="GG.xshader.settumblerotr(this.checked * 0.005)"/>
        </span>
        <span class="help">perform multidimensional tumble (very much w.i.p.)
        </span>

        <br>
        <b>loaded files: </b>
        <span id="visibles"></span>

        <span><span><br><b>available files: </b>
            <select onchange="GG.basic.loaddrop(event);" id="filedropbox">
                <option value="!none!">none available</option>
            </select></span>
            <span class="help">Load additional datasets from those available at our host.
            <br>
            The dropdown has a list of all such available datasets.
            <br>
            <br>
            You can also load additional datasets from your local filesystem
            <br>
            by drag/drop from explorer or similar onto the canvas.
            <br>
            <br>
            For some odd reason copy/paste works for text (including URLs), but does NOT work for files.
            <br>
            <br>
            In future we also hope to be able to drag/drop or copy/paste URLs from the Star Carr archive.
        </span></span>

        <span>
            <b>Colour by:</b>
            <select onchange="GG.cols.set(event.srcElement.value)" id="colourby">
                <!-- will be filled in dynamically -->
            </select>
        </span>
        <span class="help">Select a colouring strategy for this dataset from the dropdown.</span>
        <!-- can't find reliable single event or even events for when OK clicked with no change  -->
        <input type="color" id="colourpick" value="#c0c0c0"
            oninput="GG.cols.set(event.srcElement.value, true)"/>
        <span class="help">Select a fixed colour for this dataset.</span>
        <br>
        <span>
        <b>Spot size:</b>
            <span id="spots">
                0.01<input type="radio" name="spotsize" id="spot0.01"/>
                0.02<input type="radio" name="spotsize" id="spot0.02"/>
                0.05<input type="radio" name="spotsize" id="spot0.05"/>
                0.1<input type="radio" name="spotsize" id="spot0.1"/>
                0.2<input type="radio" name="spotsize" id="spot0.2"/>
                0.5<input type="radio" name="spotsize" id="spot0.5"/>
                1<input type="radio" name="spotsize" id="spot1"/>
                2<input type="radio" name="spotsize" id="spot2"/>
                5<input type="radio" name="spotsize" id="spot5"/>
                10<input type="radio" name="spotsize" id="spot10"/>
                20<input type="radio" name="spotsize" id="spot20"/>
                50<input type="radio" name="spotsize" id="spot50"/>
            </span>
        </span>
        <span class="help">Choose size of each point.<br>Hover to preview, click to select.</span>

        <br>
        <span>wireframe
        <input type='checkbox' id='wireframe' onchange='currentXyz.material.wireframe = wireframe.checked'/>
        </span>
        <span class="help">Display current object in wireframe.</span>


        <fieldset style="width:20em">
            <legend onclick="toggleFold(this)">details...</legend>
            <div>
                <span>
                    <b>Z scale:</b>
                    1<input type="radio" id="zsc1" name="zscale" onclick="currentXyz.gb.scale(1,1,1);"/>
                    2<input type="radio" id="zsc2" name="zscale" onclick="currentXyz.gb.scale(1,1,2);"/>
                    5<input type="radio" id="zsc5" name="zscale" onclick="currentXyz.gb.scale(1,1,5);"/>
                    10<input type="radio" id="zsc10" name="zscale" onclick="currentXyz.gb.scale(1,1,10);"/>
                </span>
                <span class="help">select amount to exaggerate depth</span>
                <br>
                <b>View:</b>
                elevation:<input type="radio" id="elev" name="zscale" onclick="currentXyz.gb.elevation()"/>
                <span class="help">jump to elevation view</span>
                plan:<input type="radio" id="plan" name="zscale" onclick="currentXyz.gb.plan()"/>
                <span class="help">jump to plan view</span>
                <br>

                <br>
                <span><span><b>photos:</b> <input id="photoscheck" type="checkbox" onclick="GG.ps.photoShader_clicked(event)"/></br>
                </span>
                <span class="help">Select to impose photographs on each data point.<br>
                Experimental, no sensible photos currently available in this demo.</span>
                </span>

                <span><span><b>raycast:</b> <input id="raycastcheck" type="checkbox" onclick="GG.raycast.enableRaycast(this.checked)"/></br>
                </span>
                <span class="help">Select to impose photographs on each data point.<br>
                Experimental, no sensible photos currently available in this demo.</span>
                </span>

                <br>
                <span><button onclick="currentXyz.tdata.savefiles()">save columns</button></span>
                <span class="help">Save the columns files for current xys object.<br>
                    These can be loaded by drag-drop from Explorer or equivalent.
                </span>
                <br>
                <div id="narrow">
                    <p id="filtcount"></p>
                    <span>
                        <b>Control:</b><br>
                        <textarea id="filterbox" rows="4" cols="40" onkeyup="GG.xyz.filtergui(event);" onchange="GG.xyz.filtergui();"></textarea>
                    </span>
                    <span class="helpabove">Type custom javascript here for selection of points from dataset, and possibly colouring.
                        <ul style="margin:0">
                            <li>ctrl-enter to apply.</li>
                            <li>green background indicates correct javascript but is pending application.</li>
                            <li>white background indicates javascript has been applied.</li>
                            <li>pink background indicates incorrect javascript.</li>
                            <li>blusih background indicates javascript inappropriate for this context.</li>
                            <li></li>
                            <li>The control box may have 'special format lines based on a prefix:</li>
                            <li><b>'?'</b>: filter the data set according to the filter in the rest of the line</li>
                            <li><b>'COL:'</b>: choose a column or three.js (css) colour value for colouring the data set</li>
                            <li><b>'X:', 'Y:', 'Z:'</b>: choose an expression to override the default x,y,z columns for position</li>
                        </ul>
                    </span>

                    <br>
                    <p id="filterr"></p>
                    <br>
                    <p id="msgbox"></p>
                    <input type="file" id="fileChooser" style="display:none" multiple="multiple"/>
                </div>
            </div>
        </fieldset>

        <p id="colkey"></p>

    </div>
</div>
`
const guidiv = document.createElement('div');
guidiv.innerHTML = html;
document.body.appendChild(guidiv);
// xvalue stops non-change assignment from disturbing cursor on the filterbox
Object.defineProperty(E.filterbox, 'xvalue', {
    set: v => { v = v.trim(); if (E.filterbox.value.trim() !== v) E.filterbox.value = v }
});
console.log('main.js execute, window W set', W.closed, E.colourpick.value, X.raywidth);
guidiv.id = 'xyzviewergui';
if (!location.href.match('xyz/xyz')) { // xyz.html and html4.html
    guidiv.style.display = 'none';
    guidiv.style.position = 'absolute';
    guidiv.style.right = '0%';
    guidiv.style.top = '0%';
    guidiv.style.background = 'rgba(40,40,40,255)';
    guidiv.style.zIndex = '99999';
    const e = E.msgbox;
    document.body.prepend(e);
    e.style.fontSize = '150%'
    e.style.margin = '0'

}

// arrange for F10 to make any chart fullscreen
// (works for patchxyz, but independent)    
let mouseev;
document.addEventListener('mousemove', e => mouseev = e)
document.addEventListener('keydown', e => {
    if (e.key !== 'F10') return;
    setTimeout(() => X.currentXyz.gb.onWindowResize(), 100); // used to just happen???
    if (document.fullscreenElement) return document.exitFullscreen();
    let div = document.elementFromPoint(mouseev.clientX, mouseev.clientY);
    while (!div.classList.contains('grid-stack-item-content')) {
        div = div.parentElement;
        if (!div) return;
    }
    div.requestFullscreen();
});



