(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __markAsModule = (target) => __defProp(target, "__esModule", {value: true});
  var __commonJS = (callback, module2) => () => {
    if (!module2) {
      module2 = {exports: {}};
      callback(module2.exports, module2);
    }
    return module2.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {get: all[name], enumerable: true});
  };
  var __exportStar = (target, module2, desc) => {
    if (module2 && typeof module2 === "object" || typeof module2 === "function") {
      for (let key of __getOwnPropNames(module2))
        if (!__hasOwnProp.call(target, key) && key !== "default")
          __defProp(target, key, {get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable});
    }
    return target;
  };
  var __toModule = (module2) => {
    return __exportStar(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? {get: () => module2.default, enumerable: true} : {value: module2, enumerable: true})), module2);
  };
  var __publicField = (obj, key, value) => {
    if (typeof key !== "symbol")
      key += "";
    if (key in obj)
      return __defProp(obj, key, {enumerable: true, configurable: true, writable: true, value});
    return obj[key] = value;
  };

  // StarCarr/archstart.js
  var require_archstart = __commonJS((exports2) => {
    __markAsModule(exports2);
    __export(exports2, {
      filelist: () => filelist
    });
    var import_basic9 = require_basic();
    "use strict";
    window.lastModified.archstart = `Last modified: 2021/02/18 22:05:14
`;
    var {E: E10, GG: GG2} = window;
    XYZ.autorange = false;
    ggb().defaultDistance = 50;
    ggb().defaultFov = 50;
    ggb().home();
    var filelist = `
Flint.csv
Fungi.csv
Stones.csv
SC13-15_wood_data.csv
BirchBarkRolls.csv
Faunal.csv
FishHandCollected.csv
contours.geojson
feature.geojson
fishseived.geojson
starcarrsurf.geojson
trenches.geojson
woodplanned.geojson
sample.cols
vp10_dr004.dxf
ta02801_DSM_2M.asc
ta0280_DSM_2M.asc
ta0281_DSM_2M.asc`.trim().split("\n");
    filelist.forEach((n) => (0, import_basic9.addToFilelist)("StarCarr/" + n, "StarCarr/" + n, n));
    document.title = "Star Carr: xyzviewer";
    var starturi = "StarCarr/Flint.csv";
    (async function start2() {
      await (0, import_basic9.posturiasync)(starturi);
      ggb().plan();
      refit();
      await (0, import_basic9.posturiasync)("StarCarr/contours.geojson");
      E10.msgbox.innerHTML = "StarCarr load time: " + (Date.now() - GG2.starttime);
    })();
    var archxref = `<a href="https://archaeologydataservice.ac.uk/archives/view/postglacial_2013/index.cfm" target="_blank">
Project archive and further details
</a>`;
    var archhh = `
<div iD="archhh">
xyzviewer code:
<ul>
<li>Goldsmiths, University of London</li>
</ul>
Star Carr Data and Support:
<ul>
<li>${archxref}</li>
<li>University of York</li>
<li>Archaeology Data Services</li>
<li>Manchester</li>
<li>erc</li>
<li>Historic England</li>
<li>British Academy</li>
<li>NERC</li>
<li>University of Chester</li>
<li>Arts and Humanities Research Council</li>
<li>UCL</li>
<li>heritage lottery fund</li>
<li>Social Sciences and Humanities, Research Council of Canada</li>
<li>Chartered Institute for Archaeologists</li>
</ul>
</div>
`;
    E10.ack.innerHTML = archhh;
    setTimeout(() => E10.ack.style.display = "none", 1e4);
  });

  // extras/folddemo.js
  var require_folddemo = __commonJS(() => {
    var import_basic9 = require_basic();
    "use strict";
    var {E: E10} = window;
    var folddemo_st;
    var virchains = [];
    var polygonmesh;
    var rlines2;
    var groupgeom;
    var myxyz2;
    XYZ.autorange = false;
    ggb().defaultDistance = 400;
    ggb().defaultFov = 50;
    ggb().home();
    function folddemofun(tt = 1e4, gap = 2e3) {
      if (centrerange.x === Infinity) {
        (0, import_basic9.posturiasync)("data/4bcufullCA.pdb", (d, f) => {
          myxyz2 = pdbReader(d, f);
          folddemofun();
        });
        return;
      }
      virchaindists();
      virusshow();
      setPointSize(5);
      COLS.set("resname");
      ggb().fullcanvas(true);
      if (!folddemo_st)
        requestAnimationFrame(foldframe);
      folddemo_st = Date.now();
      function foldframe() {
        const t = Date.now() - folddemo_st;
        if (t > 2 * tt + gap) {
          expandchain(0, 0);
          folddemo_st = void 0;
          return;
        }
        if (t < tt) {
          const dt = t / tt;
          expandchain(0.5 + 0.5 * dt, 0.5 - 0.5 * dt);
        } else if (t > tt + gap) {
          const dt = (t - tt - gap) / tt;
          expandchain(1 - dt, 0);
        }
        requestAnimationFrame(foldframe);
      }
      document.title = "xyzviewer: fold demo";
    }
    folddemofun();
    function makevirchains(l = 5, cols2 = myxyz2.tdata.fvals) {
      const xc = cols2["x"], yc = cols2["y"], zc = cols2["z"];
      const chainc = cols2.chain;
      virchains = [];
      let c2 = -1, i = -1;
      let s = new THREE.Vector3(), near = s, far = s;
      const posi = new THREE.Vector3(), posn = new THREE.Vector3();
      startc();
      function startc() {
        c2++;
        s = new THREE.Vector3();
        near = new THREE.Vector3(Infinity, Infinity, Infinity);
        far = new THREE.Vector3(0, 0, 0);
        virchains[c2] = {start: i + 1, s, near, far};
      }
      for (i = 0; i < xc.length; i++) {
        chainc[i] = c2;
        posi.set(xc[i], yc[i], zc[i]);
        posn.set(xc[i + 1], yc[i + 1], zc[i + 1]);
        s.addVectors(s, posi);
        const dummyend = i === xc.length - 1;
        const d = dummyend ? 99999 : posi.distanceTo(posn);
        if (posi.length() < near.length())
          near.copy(posi);
        if (posi.length() > far.length())
          far.copy(posi);
        if (d > l) {
          const ch = virchains[c2];
          ch.n = i - ch.start + 1;
          ch.centroid = s.multiplyScalar(1 / ch.n);
          ch.end = i;
          if (!dummyend)
            startc();
        }
      }
      console.log("number of chains for separation", l, "is", c2);
      myxyz2.tdata.ranges.chain = myxyz2.tdata.genstats("chain");
      return virchains;
    }
    function virchaindists(sc = 1) {
      if (virchains.length === 0)
        makevirchains();
      const dds = [];
      if (!groupgeom) {
        groupgeom = new THREE.Group();
        ggb().addToMain(groupgeom, "pdbgroup");
      }
      groupgeom.scale.set(sc, sc, sc);
      const linegeom = new THREE.BufferGeometry(), vertices = [], colors = [];
      virchains.forEach((c2) => c2.close = []);
      const cols2 = {30: col3(1, 1, 1), 34: col3(1, 1, 0), 42: col3(1, 0, 0), 49: col3(0, 0, 1)};
      for (let i = 0; i < virchains.length; i++) {
        const chi = virchains[i];
        for (let j = i + 1; j < virchains.length; j++) {
          const chj = virchains[j];
          const d = chi.centroid.distanceTo(chj.centroid);
          dds.push({i, j, d});
          if (d < 50) {
            chi.close.push(j);
            chj.close.push(i);
            vertices.push(chi.near.x, chi.near.y, chi.near.z);
            vertices.push(chj.near.x, chj.near.y, chj.near.z);
            const colx = cols2[Math.floor(d)];
            const col = colx ? colx.clone() : col3(0, 1, 0);
            colors.push(col.r, col.g, col.b);
            colors.push(col.r, col.g, col.b);
          }
        }
      }
      linegeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
      linegeom.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
      const linemat = new THREE.LineBasicMaterial({color: 16777215, opacity: 1, linewidth: 1, vertexColors: true});
      groupgeom.remove(rlines2);
      rlines2 = new THREE.LineSegments(linegeom, linemat);
      ggb().addToMain(rlines2, "poly lines", groupgeom);
      dds.sort((a, b) => a.d - b.d);
      const ds = dds.map((s) => s.d);
      const dists = ds.filter(function(v, i, a) {
        if (v < a[i - 1] + 0.2)
          return 0;
        return 1;
      });
      (0, import_basic9.log)("discrete distances found, ascending order", dists);
      const t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), t3 = new THREE.Vector3();
      const trigeom = new THREE.BufferGeometry(), verticest = [], colorst = [], normalst = [];
      let n = 0;
      for (let i = 0; i < virchains.length; i++) {
        const chi = virchains[i];
        const cl = chi.close;
        const a = chi.centroid;
        cl.forEach((j) => {
          const chj = virchains[j];
          const b = chj.centroid;
          if (j <= i)
            return;
          cl.forEach((k) => {
            if (k <= j)
              return;
            if (chj.close.indexOf(k) === -1)
              return;
            const chk = virchains[k];
            const c2 = chk.centroid;
            let chainset = new Set([i, j, k]);
            const ds2 = [Math.floor(a.distanceTo(b)), Math.floor(a.distanceTo(c2)), Math.floor(b.distanceTo(c2))];
            const ck = ds2.sort().join("");
            let col;
            switch (ck) {
              case "304949":
                {
                  col = cols2[30];
                  let pentagon = chi.pentagon || chj.pentagon || chk.pentagon || chainset;
                  pentagon.add(i).add(j).add(k);
                  chi.pentagon = chj.pentagon = chk.pentagon = pentagon;
                  chainset = pentagon;
                }
                break;
              case "303049":
                return;
              case "424242":
                chi.trimer = chj.trimer = chk.trimer = chainset;
                col = cols2[42];
                break;
              case "303442":
                col = cols2[49];
                break;
              default:
                col = cols2[49];
                break;
            }
            verticest.push(chi.near.x, chi.near.y, chi.near.z);
            verticest.push(chj.near.x, chj.near.y, chj.near.z);
            verticest.push(chk.near.x, chk.near.y, chk.near.z);
            colorst.push(col.r, col.g, col.b);
            colorst.push(col.r, col.g, col.b);
            colorst.push(col.r, col.g, col.b);
            t1.subVectors(chi.near, chj.near);
            t2.subVectors(chj.near, chk.near);
            t3.crossVectors(t1, t2).normalize();
            normalst.push(t3.x, t3.y, t3.z);
            normalst.push(t3.x, t3.y, t3.z);
            normalst.push(t3.x, t3.y, t3.z);
          });
        });
        trigeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(verticest), 3));
        trigeom.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colorst), 3));
        trigeom.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(normalst), 3));
      }
      for (let i = 0; i < virchains.length; i++) {
        const chi = virchains[i];
        const tri = chi.trimer = Array.from(chi.trimer);
        chi.tripos = tri.reduce((a, v) => a.addVectors(a, virchains[v].centroid), new THREE.Vector3()).multiplyScalar(1 / 3);
        const pent = chi.pentagon = Array.from(chi.pentagon);
        chi.pentpos = pent.reduce((a, v) => a.addVectors(a, virchains[v].centroid), new THREE.Vector3()).multiplyScalar(1 / 5);
      }
      (0, import_basic9.log)("chain tripos etc computed in chaindists");
      const meshmat = new THREE.MeshPhongMaterial({color: 16777215, opacity: 1, vertexColors: true, side: THREE.DoubleSide});
      if (polygonmesh)
        groupgeom.remove(polygonmesh);
      polygonmesh = new THREE.Mesh(trigeom, meshmat);
      ggb().addToMain(polygonmesh, "polygon", groupgeom);
      return dds;
    }
    var opos;
    function expandchain(trik = 0, pentk = 0, cenk = 0) {
      const tdata = myxyz2.tdata;
      const xc = tdata.fvals["x"], yc = tdata.fvals["y"], zc = tdata.fvals["z"], chainc = tdata.fvals["chain"];
      if (!opos) {
        opos = [];
        for (let i = 0; i < xc.length; i++)
          opos[i] = new THREE.Vector3(xc[i], yc[i], zc[i]);
      }
      if (!rlines2)
        virchaindists();
      for (let i = 0; i < xc.length; i++) {
        const ch = virchains[chainc[i]];
        const cen = ch.centroid.clone().multiplyScalar(cenk);
        const tri = ch.tripos.clone().multiplyScalar(trik);
        const pent = ch.pentpos.clone().multiplyScalar(pentk);
        cen.add(tri).add(pent).add(opos[i]);
        xc[i] = cen.x;
        yc[i] = cen.y;
        zc[i] = cen.z;
      }
      dataToMarkersGui();
    }
    function virusshow() {
      E10.colourby.value = "fixed";
      if (ggb().usePhotoShader) {
        myxyz2.setPointSize(2);
        E10.colourby.value = "random";
      }
      dataToMarkersGui();
    }
  });

  // basic.js
  var require_basic = __commonJS((exports) => {
    __markAsModule(exports);
    __export(exports, {
      addFileTypeHandler: () => addFileTypeHandler,
      addToFilelist: () => addToFilelist,
      addscript: () => addscript,
      availableFileList: () => availableFileList,
      fileReader: () => fileReader,
      fireev: () => fireev,
      getStartdata: () => getStartdata,
      handlerForFid: () => handlerForFid,
      killev: () => killev,
      lineSplitter: () => lineSplitter,
      loaddrop: () => loaddrop,
      log: () => log,
      posturiasync: () => posturiasync,
      queryVariables: () => queryVariables,
      readyFiles: () => readyFiles,
      saveData: () => saveData,
      showfirstdata: () => showfirstdata,
      sleep: () => sleep,
      streamReader: () => streamReader,
      waitev: () => waitev,
      writeFile: () => writeFile
    });
    var GGbasic = require_basic();
    window.lastModified.basic = `Last modified: 2023/03/15 12:41:57
`;
    if (!window.GG)
      window.GG = {};
    if (!window.E)
      window.E = window;
    var {E, X} = window;
    var {GG} = window;
    GG.cols = COLS;
    GG.ps = photoshader_exports;
    GG.tdata = tdata_exports;
    GG.xyz = xyz_exports;
    GG.basic = GGbasic;
    GG.lasso = lasso_exports;
    GG.lassoshader = lassoshader_exports;
    GG.xshader = xshader_exports;
    GG.raycast = raycast_exports;
    GG.gb = graphicsboiler_exports;
    GG.expose = () => {
      for (const f in GG)
        Object.assign(window, GG[f]);
    };
    GG.ospeech = OrganicSpeech;
    GG.xyzspeech = xyzspeech_exports;
    var queryVariables = {};
    var readyFiles = {};
    var fileTypeHandlers;
    function addFileTypeHandler(ftype, fun) {
      if (!fileTypeHandlers)
        fileTypeHandlers = {};
      fileTypeHandlers[ftype] = fun;
    }
    var log;
    log = function() {
      console.log.apply(console, arguments);
    };
    log("main.js initial log established");
    function getQueryVariables() {
      var query = window.location.search.substring(1);
      var vars = query.split("&");
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        let p = pair[1];
        if (p === void 0)
          p = true;
        else if (!isNaN(p))
          p = +p;
        else if (p === "true")
          p = true;
        else if (p === "false")
          p = false;
        queryVariables[decodeURIComponent(pair[0])] = p;
      }
    }
    getQueryVariables();
    function getStartdata() {
      const wls = window.location.search || "";
      let r = "";
      if (wls.startsWith("?ox")) {
        if (location.host.startsWith("csynth") || queryVariables.remote) {
          const p = queryVariables.remote ? "/remote/https://csynth.molbiol.ox.ac.uk/csynthstatic/xyzdata/" : "../xyzdata/";
          if (wls.startsWith("?ox7m"))
            r = "COVID19_CyTOF/_Steve_UMAP3_allcells.txt.yaml";
          else if (wls.startsWith("?oxm"))
            r = "fromMLV/fromMLV.yaml";
          else
            r = "cytof/cytof_1.5million_anonymised.txt.yaml";
          r = p + r;
        } else if (location.host.startsWith("localhost") || location.href.startsWith("127.0.0.1")) {
          if (wls.startsWith("?ox7m"))
            r = ",,/,,/,,/,,/BigPointData/t1-data/user/erepapi/Fellowship/COVID19_CyTOF/_Steve_UMAP3_allcells.txt.yaml";
          else if (wls.startsWith("?oxm"))
            r = ",,/,,/,,/,,/BigPointData/fromMLV/fromMLV.yaml";
          else
            r = ",,/,,/,,/,,/BigPointData/cytof/cytof_1.5million_anonymised.txt.yaml";
        }
        XYZ.baseguiset.spotsize = 0.02;
      }
      return r;
    }
    async function showfirstdata() {
      if (location.href.indexOf("xyz.html") === -1)
        return;
      const wls = window.location.search;
      if (wls.startsWith("?arch"))
        await Promise.resolve().then(() => require_archstart());
      if (wls.startsWith("?fold"))
        await Promise.resolve().then(() => __toModule(require_folddemo()));
      const sd = getStartdata();
      if (sd)
        queryVariables.startdata = sd;
      const {startcode, startdata, pdb} = queryVariables;
      if (startcode)
        eval(startcode);
      if (pdb)
        posturiasync("https://files.rcsb.org/download/" + pdb + ".pdb");
      if (startdata) {
        const startlist = startdata.split("'").join("").split('"').join("").split(";");
        startlist.forEach((s) => {
          if (s.startsWith("http") && location.hostname === "localhost")
            s = X.proxy + s;
          posturiasync(s);
        });
      }
    }
    document.ondragover = docdragover;
    document.ondrop = docdroppaste;
    document.onpaste = docdroppaste;
    async function posturiasync(puri, callb, data = "") {
      console.time("load: " + puri);
      if (!callb)
        callb = await handlerForFid(puri);
      const binary = puri.endsWith(".ply");
      return new Promise((resolve) => {
        var req = new XMLHttpRequest();
        req.open("GET", puri, true);
        if (binary)
          req.responseType = "arraybuffer";
        req.setRequestHeader("Content-type", binary ? "application/octet-stream" : "text/plain;charset=UTF-8");
        req.send(data);
        req.onload = function() {
          console.timeEnd("load: " + puri);
          callb(binary ? req.response : req.responseText, puri);
          resolve();
        };
        req.onerror = function(oEvent) {
          console.error("cannot load", puri, oEvent);
        };
        req.ontimeout = function(oEvent) {
          console.error("timeout error, cannot load", puri, oEvent);
        };
      });
    }
    E.fileChooser.onclick = function(evtp) {
      this.value = null;
    };
    E.fileChooser.onchange = function(evtp) {
      openfiles(evtp.target);
    };
    var lastdroptarget;
    function openfiles(droptarget = lastdroptarget) {
      lastdroptarget = droptarget;
      let {files, items} = droptarget;
      if (!items)
        items = {};
      for (let f = 0; f < files.length; f++)
        openfile(files[f], items[f]);
    }
    async function handlerForFid(fid) {
      const ext = getFileExtension(fid);
      let handler = fileTypeHandlers[ext];
      const ii = "./plugins/" + ext.substring(1) + "reader.js";
      if (!handler) {
        try {
          await Promise.resolve().then(() => __toModule(require(ii)));
        } catch (e2) {
          alert("Cannot load handler " + ii);
        }
        handler = fileTypeHandlers[ext];
      }
      return handler;
    }
    async function openfile(file, item) {
      if (document.title === "xyzviewer")
        document.title += ": " + file.name;
      if (item) {
        const entry = item.webkitGetAsEntry();
        file.fullPath = entry.fullPath;
        if (entry.isDirectory)
          return openDirectory(entry);
      }
      readyFiles[file.fullPath] = file;
      console.time("load file: " + file.fullPath);
      const handler = await handlerForFid(file.fullPath);
      if (handler && handler.rawhandler) {
        handler(file, file.fullPath);
      } else if (handler) {
        var reader = new FileReader();
        reader.onload = function(e2) {
          var data = e2.target.result;
          console.timeEnd("load file: " + file.fullPath);
          log("load", file.name, data.length);
          handler(data, file.fullPath);
        };
        reader.onerror = function(e2) {
          console.error("failure reading", file.fullPath, e2);
        };
        const ext = getFileExtension(file.fullPath);
        if (ext === ".tif" || ext === ".ply" || ext === ".stl")
          reader.readAsArrayBuffer(file);
        else if (ext === ".xlsx")
          reader.readAsBinaryString(file);
        else
          reader.readAsText(file);
      } else {
        console.error("attempt to open file of wrong filetype " + file.fullPath);
      }
    }
    async function _scanFiles(item, availableFileList3 = {}, directoryEntries = {}) {
      return new Promise((resolve) => {
        if (item.isDirectory) {
          directoryEntries[item.fullPath] = item;
          let directoryReader = item.createReader();
          let getEntries = async function() {
            directoryReader.readEntries(async function(entries) {
              if (entries.length === 0) {
                resolve();
                return;
              }
              for (const entry of entries) {
                await _scanFiles(entry, availableFileList3, directoryEntries);
              }
              getEntries();
            });
          };
          getEntries();
        } else if (item.isFile) {
          availableFileList3[item.fullPath] = item;
          resolve();
        }
      });
    }
    var availableFileList = {};
    async function openDirectory(entry) {
      let directoryEntries = {};
      await _scanFiles(entry, availableFileList, directoryEntries);
      log("found files:", Object.keys(availableFileList), Object.keys(directoryEntries));
      for (const fullPath in availableFileList) {
        const handler = await handlerForFid(fullPath);
        if (handler && !handler.hidden)
          addToFilelist(fullPath, availableFileList[fullPath]);
      }
    }
    var selectableFileList = {};
    function addToFilelist(fullPath, fileEntry, displayName) {
      E.filedropbox.innerHTML = E.filedropbox.innerHTML.replace("none available", "none selected");
      displayName = displayName || (typeof fileEntry === "string" ? fileEntry : fileEntry.name);
      E.filedropbox.innerHTML += `<option value="${fullPath}" title="${fullPath}">${displayName}</option>`;
      selectableFileList[fullPath] = fileEntry;
    }
    function loaddrop() {
      const fid = document.getElementById("filedropbox").value;
      if (fid === "!none!")
        return;
      const fileEntryUrl = selectableFileList[fid];
      if (fileEntryUrl.isFile) {
        fileEntryUrl.file((file) => {
          file.fullPath = fid;
          openfile(file);
        });
      } else {
        posturiasync(fileEntryUrl);
      }
    }
    function writeFile(fid, text, append = false) {
      var oReq = new XMLHttpRequest();
      oReq.open("POST", append ? "appendfile.php" : "savefile.php", false);
      oReq.setRequestHeader("Content-Disposition", fid);
      oReq.send(text);
      log("writetextremote", fid, "response text", oReq.responseText);
    }
    function docdroppaste(evt) {
      if (evt.srcElement instanceof HTMLTextAreaElement)
        return;
      var dt = evt.dataTransfer || evt.clipboardData;
      if (!dt) {
        console.error("unexpected dragdrop");
        return killev(evt);
      }
      dt.dropEffect = "copy";
      var data = dt.getData("text/plain");
      if (dt.files.length > 0) {
        log("dragdrop", dt.files);
        openfiles(dt);
      } else if (data !== "") {
        try {
          if (data.startsWith("http:") || data.startsWith("https:"))
            posturiasync(X.proxy + data);
          else
            eval(data);
        } catch (e2) {
          console.error("problem handling dropped text", data, e2);
        }
      }
      return killev(evt);
    }
    function docdragover(evt) {
      evt.dataTransfer.dropEffect = "copy";
      return killev(evt);
    }
    function getFileExtension(fid) {
      if (fid.indexOf(".") !== -1)
        return "." + fid.split(".").pop();
      else
        return ".";
    }
    function streamReader(url, chunkProcess, endProcess) {
      const td = new TextDecoder("ascii");
      let n = 0, len, reader;
      function processText({done, value}) {
        if (done) {
          log(url, "done", n, len);
          if (endProcess)
            endProcess(n, len);
          return;
        }
        n += value.length;
        chunkProcess(td.decode(value), n, len);
        return reader.read().then(processText);
      }
      fetch(url).then((resp) => {
        resp.headers.forEach((...x) => log(x));
        len = +resp.headers.get("content-length");
        reader = resp.body.getReader();
        reader.read().then(processText);
      });
    }
    async function fileReader(file, chunkProcess = log, endProcess = () => log("end"), chunksize = 2 ** 17) {
      let off = 0;
      while (true) {
        const slice = file.slice(off, off + chunksize);
        const chunk = await slice.text();
        if (chunk.length === 0)
          break;
        off += chunksize;
        chunkProcess(chunk, off, file.size);
      }
      endProcess();
    }
    function lineSplitter(lineProcess = (l, n, b, bsf, len) => {
      if (n % 100 === 0)
        log(n, l, b, bsf, len);
    }) {
      let pend = "";
      let lines = 0, bytes = 0;
      return function(chunk, bytesSoFar, length) {
        const ll = chunk.split("\n");
        ll[0] = pend + ll[0];
        pend = ll[ll.length - 1];
        for (let i = 0; i < ll.length - 1; i++) {
          bytes += ll[i].length + 1;
          lineProcess(ll[i], ++lines, bytes, bytesSoFar, length);
        }
      };
    }
    function saveData(fileName, ...data) {
      const blob = new Blob(data);
      var a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      var url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    }
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    var xx = new THREE.EventDispatcher();
    function waitev(type) {
      return new Promise((resolve) => {
        var r = (s) => {
          xx.removeEventListener(type, r);
          resolve(s.data);
        };
        xx.addEventListener(type, r);
      });
    }
    function fireev(type, data) {
      xx.dispatchEvent({type, data});
    }
    function addscript(src, type = "text/javascript") {
      var head = document.getElementsByTagName("head")[0];
      var script = document.createElement("script");
      script.type = type;
      script.src = src;
      head.appendChild(script);
      return new Promise((resolve) => {
        script.onload = () => {
          resolve();
        };
      });
    }
    function killev(event) {
      event.stopPropagation();
      event.preventDefault();
      return true;
    }
    (async function() {
      GG.test = () => {
        let s = location.href.split("?")[0] + "?";
        const test = (k) => open(s + k, "_blank");
        test("ox");
        test("arch");
        test("pdb=6vxx");
        test("fold");
        s = s.replace("/xyz.html", "/xyz4.html");
        test("");
      };
      showfirstdata();
      window.dispatchEvent(new Event("GGLoaded"));
    })();
  });

  // xyz.js
  var xyz_exports = {};
  __export(xyz_exports, {
    XYZ: () => XYZ,
    _baseiNaN: () => _baseiNaN,
    centrerange: () => centrerange,
    col3: () => col3,
    dataToMarkersGui: () => dataToMarkersGui,
    filterAdd: () => filterAdd,
    filterRemove: () => filterRemove,
    filtergui: () => filtergui,
    setPointSize: () => setPointSize
  });

  // graphicsboiler.js
  var graphicsboiler_exports = {};
  __export(graphicsboiler_exports, {
    GraphicsBoiler: () => GraphicsBoiler,
    ggb: () => ggb
  });

  // threeH.js
  window.lastModified.threeH = `Last modified: 2021/03/25 16:53:37
`;
  var {X: X2} = window;
  var {THREE} = X2;
  console.log(">>>>threeH.js global");

  // cols.js
  var import_basic3 = require_basic();

  // jsdeps/colorHelpers.js
  window.lastModified.xyz = `Last modified: 2021/08/02 18:09:47
`;
  console.log(">>>>colorHelpers.js");
  var e = 1 / 2.2;
  var rg = 0.5;
  var gr = 0.5;
  var kr = 6;
  var kg = 10;
  var kb = 3;
  var sss = {e, rg, gr, kr, kg, kb};
  function deltaRGBS(r1, r2) {
    return kr * Math.abs((r1[0] + r1[1] * rg) ** e - (r2[0] + r2[1] * gr) ** e) + kg * Math.abs((r1[1] + r1[0] * rg) ** e - (r2[1] + r2[0] * gr) ** e) + kb * Math.abs(r1[2] ** e - r2[2] ** e);
  }
  var deltaRGB = deltaRGBS;
  function deltaHSV(h1, h2) {
    return deltaRGB(hsv2rgb(h1), hsv2rgb(h2));
  }
  var eqcols = void 0;
  makeColeq();
  function makeColeq(pp = {}) {
    Object.assign(sss, pp);
    ({e, rg, gr, kr, kg, kb} = sss);
    console.log("makeColeq", sss);
    const n = 500;
    let s = 0, cd = [];
    const v = 1;
    for (let i = 0; i < n; i++) {
      const h = i / n, h1 = (i + 1) / n;
      const d = deltaHSV([h, 1, v], [h1, 1, v]);
      cd[i] = s;
      s += d;
    }
    cd = cd.map((v2) => v2 / s);
    cd.push(9999);
    cd[-1] = 2 * cd[0] - cd[1];
    let k = 0;
    const o2 = [];
    const oh = [];
    for (let i = 0; i < n; i++) {
      const tcd = i / n;
      while (cd[k] < tcd)
        k++;
      const cdl = cd[k - 1];
      const cdh = cd[k];
      let h = oh[i] = (k - 1 + (tcd - cdl) / (cdh - cdl)) / n;
      const oo = o2[i] = hsv2rgb(h, 1, 1);
      let gamma = 1 / 2.2;
      oo.r = oo.r ** gamma;
      oo.g = oo.g ** gamma;
      oo.b = oo.b ** gamma;
    }
    eqcols = o2;
    return o2;
  }
  function hsv2rgb(h, s, v, ret) {
    let arr = false;
    if (Array.isArray(h)) {
      s = h[1];
      v = h[2];
      h = h[0];
      arr = true;
    }
    if (typeof h !== "number") {
      s = h.s;
      v = h.v;
      h = h.h;
    }
    let r, g, b;
    let i;
    let f, p, q, t;
    h = h % 1 * 360;
    s = Math.max(0, Math.min(1, s));
    if (s === 0) {
      r = g = b = v;
    } else {
      h /= 60;
      i = Math.floor(h);
      f = h - i;
      p = v * (1 - s);
      q = v * (1 - s * f);
      t = v * (1 - s * (1 - f));
      switch (i) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;
        case 1:
          r = q;
          g = v;
          b = p;
          break;
        case 2:
          r = p;
          g = v;
          b = t;
          break;
        case 3:
          r = p;
          g = q;
          b = v;
          break;
        case 4:
          r = t;
          g = p;
          b = v;
          break;
        default:
          r = v;
          g = p;
          b = q;
      }
    }
    if (arr)
      return [r, g, b];
    if (!ret)
      ret = new THREE.Color();
    ret.setRGB(r, g, b);
    return ret;
  }
  THREE.Color.prototype.setHSV = function(h, s = 1, v = 1, ret) {
    hsv2rgb(h, s, v, this);
    return this;
  };

  // xshader.js
  var xshader_exports = {};
  __export(xshader_exports, {
    MM: () => MM,
    ND: () => ND,
    checklist: () => checklist,
    cols: () => cols,
    modXShader: () => modXShader,
    setmouserot: () => setmouserot,
    setobj: () => setobj,
    settumblerotl: () => settumblerotl,
    settumblerotr: () => settumblerotr,
    showxmat: () => showxmat,
    uniforms: () => uniforms,
    useXShader: () => useXShader,
    usecheck: () => usecheck,
    vmap: () => vmap,
    xclick: () => xclick,
    xmat: () => xmat
  });
  "use strict";
  var WA = window;
  var {X: X3, math} = WA;
  var xmat = void 0;
  var me;
  var _MM = class {
    constructor() {
      this.m = new Float32Array(ND * ND);
      this.id();
      me = this;
    }
    static init() {
      _MM.tempmm1 = new _MM();
      _MM.tempmm2 = new _MM();
      _MM.tempmm3 = new _MM();
    }
    id() {
      this.m.fill(0);
      for (let i = 0; i < ND; i++)
        this.m[i * (ND + 1)] = 1;
      if (this === xmat)
        showxmat();
    }
    toString() {
      return Array.from(this.m).map((x) => x.toFixed(3)).join(" ");
    }
    mult(am, bm) {
      const o2 = this.m, a = am.m, b = bm.m;
      o2.fill(0);
      for (let col = 0; col < ND; col++)
        for (let row = 0; row < ND; row++)
          for (let k = 0; k < ND; k++)
            o2[col + row * ND] += a[k + row * ND] * b[col + k * ND];
      return this;
    }
    lmult(am) {
      return this.mult(am, _MM.tempmm1.copy(this));
    }
    rmult(bm) {
      return this.mult(_MM.tempmm1.copy(this), bm);
    }
    copy(m) {
      this.m.set(m.m);
      return this;
    }
    clone() {
      return new _MM().copy(this);
    }
    makerot(i, j, d) {
      this.id();
      const c2 = Math.cos(d), s = Math.sin(d);
      const o2 = this.m;
      o2[i * ND + i] = o2[j * ND + j] = c2;
      o2[i * ND + j] = s;
      o2[j * ND + i] = -s;
      return this;
    }
    applyrotr(i, j, d) {
      this.rmult(_MM.tempmm2.makerot(i, j, d));
    }
    applyrotl(i, j, d) {
      this.lmult(_MM.tempmm2.makerot(i, j, d));
    }
    random() {
      const o2 = this.m;
      for (let i = 0; i < ND; i++)
        for (let j = 0; j < ND; j++)
          o2[i * ND + j] = Math.random() * 2 - 1;
      return this;
    }
    transpose() {
      _MM.tempmm1.copy(this);
      const o2 = this.m, f = _MM.tempmm1.m;
      for (let i = 0; i < ND; i++)
        for (let j = 0; j < ND; j++)
          o2[i + ND * j] = f[j + ND * i];
      return this;
    }
    tomath() {
      return math.reshape(Array.from(this.m), [ND, ND]);
    }
    frommath(m) {
      this.m.set(math.reshape(m, [ND * ND]));
      return this;
    }
    mat(op) {
      const x = this.tomath();
      const y = op(x);
      if (typeof y === "number")
        return y;
      return this.frommath(y);
    }
    inv() {
      return this.mat(math.inv);
    }
    sqrt() {
      return this.mat(math.sqrtm);
    }
    det() {
      return this.mat(math.det);
    }
    scale(k) {
      this.m.forEach((x, i, t) => t[i] = x * k);
      return this;
    }
    add(a, b) {
      this.m.forEach((x, i, t) => t[i] = a[i] + b[i]);
      return this;
    }
    dotrow(r1, r2) {
      const o2 = this.m;
      let s = 0;
      for (let k = 0; k < ND; k++)
        s += o2[r1 * ND + k] * o2[r2 * ND + k];
      return s;
    }
    randrow(row, d = 0.1) {
      const o2 = this.m;
      for (let col = 0; col < ND; col++)
        if (getm(col, row) === void 0)
          o2[row * ND + col] += (Math.random() - 0.5) * d;
    }
    vforrow(row) {
      let v;
      for (let col = 0; col < ND; col++) {
        if (v = getm(col, row))
          return [col, v];
      }
      return void 0;
    }
    vforcol(col) {
      let v;
      for (let row = 0; row < ND; row++) {
        if (v = getm(col, row))
          return [col, v];
      }
      return void 0;
    }
    toOrth(f = 1) {
      console.log("=-=-  before orth", xmat.det());
      const o2 = this.m;
      o2.map((v, i) => o2[i] = isNaN(v) ? 0.2 : v > 1 ? 1 : v < -1 ? -1 : v);
      this.lastm = o2.slice();
      for (let row = 0; row < ND; row++) {
        console.log("???>>", row, this.dotrow(row, row));
        if (this.vforrow(row))
          continue;
        let oda = this.dotrow(row, row);
        if (oda < 1e-10) {
          this.randrow(row);
          oda = this.dotrow(row, row);
        }
        let sf = 1 + (1 - Math.sqrt(oda));
        for (let k = 0; k < ND; k++)
          o2[row * ND + k] *= sf;
        console.log(">>>>>", row, oda, this.dotrow(row, row));
      }
      for (let rowi = 0; rowi < ND; rowi++)
        for (let rowj = 0; rowj < ND; rowj++)
          console.log("~~~", rowi, rowj, this.dotrow(rowi, rowj));
      for (let rowi = 0; rowi < ND; rowi++) {
        if (this.vforrow(rowi))
          continue;
        for (let rowj = 0; rowj < ND; rowj++) {
          if (rowj === rowi)
            continue;
          if (this.vforrow(rowj))
            continue;
          const ll = Math.sqrt(this.dotrow(rowi, rowi) * this.dotrow(rowj, rowj));
          let dot = this.dotrow(rowi, rowj);
          let osf = dot * f / ll;
          for (let k = 0; k < ND; k++) {
            if (getm(k, rowi) === void 0)
              o2[rowi * ND + k] -= osf * o2[rowj * ND + k] * 0.2;
          }
          console.log(">", rowi, rowj, dot / ll, me.dotrow(rowi, rowj));
        }
      }
      if (this.m.filter((x) => isNaN(x)).length) {
        console.log(">>>> NaN error");
      }
      console.log("=-=-  after orth", xmat.det());
    }
    rotv() {
      let mx = 0;
      for (let k = 0; k < ND * ND; k++)
        if (k % (ND + 1) !== 0)
          mx = Math.max(mx, Math.abs(this.m[k]));
      return mx;
    }
  };
  var MM = _MM;
  __publicField(MM, "tempmm1");
  __publicField(MM, "tempmm2");
  __publicField(MM, "tempmm3");
  var ND = 6;
  MM.init();
  var uniforms;
  var shader;
  var lastid;
  var tumblerotl = 0;
  var tumblerotr = 0;
  var mouserot = 3e-3;
  xmat = new MM();
  var lastxmat = new MM();
  var checklist = {};
  var cols;
  var vmap = [];
  for (let i = 0; i < ND; i++)
    vmap[i] = new THREE.Vector2(0, 1);
  var attribs = "";
  for (let i = 0; i < ND; i++)
    attribs += `attribute float field${i};
`;
  var attset = "";
  for (let i = 0; i < ND; i++)
    attset += `rv[${i}] = field${i};
`;
  var tumblem = new MM().random();
  function tumbler() {
    const t = tumblem.m;
    for (let coli = 0; coli < ND; coli++) {
      if (me.vforcol(coli))
        continue;
      for (let colj = coli + 1; colj < ND; colj++) {
        if (me.vforcol(colj))
          continue;
        xmat.applyrotr(coli, colj, t[coli * ND + colj] * tumblerotr);
      }
    }
    showxmat();
  }
  function tumblel() {
    const t = tumblem.m;
    for (let rowi = 0; rowi < ND; rowi++) {
      if (me.vforrow(rowi))
        continue;
      for (let rowj = rowi + 1; rowj < ND; rowj++) {
        if (me.vforrow(rowj))
          continue;
        xmat.applyrotl(rowi, rowj, t[rowi * ND + rowj] * tumblerotl);
      }
    }
    showxmat();
  }
  function settumblerotr(r) {
    tumblerotr = r;
    if (r && !cols)
      useXShader();
  }
  function settumblerotl(r) {
    tumblerotl = r;
    if (r && !cols)
      useXShader();
  }
  function setmouserot(r) {
    mouserot = r;
  }
  function xShader(id = 0) {
    lastid = id;
    const vertexShader = `
/*
precision highp float;
precision highp int;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
*/
attribute vec3 color;
varying vec3 vColor;

uniform float psize;
uniform vec2 size;
uniform sampler2D lassoMap;
uniform mat4 lassoTotmat;
uniform float doLassoFilter;
uniform float doLassoColour;
#define ND ${ND}
uniform float xmat[ND*ND];

${attribs} // attribute float field0; etc
uniform vec2 vmap[ND];
//uniform vec3 lcol[ND];
//uniform vec3 hcol[ND];

void main() {
    vColor = vec3(0); // color;
    // collect input attributes (no attribute arrays)
    float rv[ND];
    ${attset}       // rv[0] = field0; etv

    // normalize as specified in vmap (typically 1.5 sds each side of mean)
    float vv[ND];
    for (int i=0; i<ND; i++) vv[i] = (rv[i] - vmap[i].x) * vmap[i].y;

    // apply matrix transformation to left of column data
    // p.s. ?WHY do graphics conventions work right to left rather than left to right?
    float o[ND];
    for (int row = 0; row < ND; row++) {    // each row of the column data
        float v = 0.;
        for (int k = 0; k < ND; k++)        // k is column of matrix, row of input data
            v += xmat[k + row*ND] * vv[k];
        o[row] = v;
    }

    // use transformed values to set up graphics
    vec3 transformed = vec3( o[0], o[1], o[2]);
    vColor.r += o[3] * 0.5 + 0.5;
    vColor.g += o[4] * 0.5 + 0.5;
    vColor.b += o[5] * 0.5 + 0.5;

    vColor.r += float(${id});  // force recompile if new id

    // lasso
    float v;
    if (size.x > 0.) {
        vec4 sv4 = lassoTotmat * vec4(transformed, 1);
        vec2 sv2 = sv4.xy / sv4.w / size;
        v = texture2D(lassoMap, sv2).x;
    } else {
        v = 1.0;
    }
    

    if (doLassoFilter != 0. && v == 0.) transformed = vec3(1e20);
    vColor *= (1. - doLassoColour + v*doLassoColour);


    vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = psize / - mvPosition.z ;
}
`;
    const fragmentShader = `
/*
precision highp float;
precision highp int;
*/
varying vec3 vColor;
uniform float gamma;

void main() {
    vec4 diffuseColor = vec4(vColor, 1.);
    gl_FragColor = pow(diffuseColor, vec4(gamma));
}
    `;
    uniforms = {
      gamma: {value: 1},
      lassoMap: {value: void 0},
      lassoTotmat: {value: new THREE.Matrix4()},
      size: {value: new THREE.Vector2(100, 100)},
      psize: {value: 1},
      doLassoFilter: {value: 0},
      doLassoColour: {value: 0},
      vmap: {value: vmap},
      xmat: {value: xmat.m}
    };
    shader = new THREE.ShaderMaterial({vertexShader, fragmentShader, uniforms});
    shader.name = "xshader";
    return shader;
  }
  async function useXShader(pcols = [], id, xyz = X3.currentXyz) {
    if (pcols === false)
      return;
    const tdata = xyz.tdata;
    const ranges = tdata.ranges;
    const allnum = [];
    for (const r in tdata.ranges)
      if (ranges[r].numNum === tdata.n)
        allnum.push(r);
    let nf = 0;
    while (true) {
      pcols = E.filterbox.value.split("\n").filter((x) => x.startsWith("MD:")).map((x) => x.substring(3).trim());
      if (pcols.length >= ND || nf >= allnum.length)
        break;
      xyz.setField("MD", allnum[nf++], false);
    }
    for (let i = ND; i < pcols.length; i++)
      xyz.commentField("MD", pcols[i], false);
    cols = typeof pcols === "string" ? pcols.split(" ") : pcols;
    const particles = xyz.particles;
    if (cols) {
      ggb().controls.enabled = false;
      ggb().plan();
      ggb().camera.position.z = 3;
      if (!particles.xmaterial)
        particles.xmaterial = xShader(id);
      particles.material = particles.xmaterial;
      particles.onBeforeRender = () => {
        const lasso = xyz.gb.lasso.lassos[0];
        if (lasso) {
          uniforms.lassoMap.value = lasso.mapt;
          uniforms.lassoTotmat.value.copy(lasso.totmat);
          uniforms.size.value.copy(lasso.size);
        } else {
          uniforms.size.value.x = -1;
        }
        if (tumblerotr !== 0)
          tumbler();
        if (tumblerotl !== 0)
          tumblel();
        showxmat();
        particles.geometry.setDrawRange(0, tdata.pendread_min);
      };
      for (let i = 0; i < ND; i++) {
        const col = cols[i];
        particles.geometry.deleteAttribute("field" + i);
        if (col) {
          if (!tdata.ranges[col]) {
            console.error("Missing column ignored", col);
            xyz.commentField("MD", col);
            continue;
          }
          if (tdata.ranges[col].range === 0) {
            console.error("Column with 0 range ignored", col);
            xyz.commentField("MD", col);
            continue;
          }
          const usealpha = tdata.ranges[col].numStrs > tdata.ranges[col].numNum;
          if (!tdata.attcols[col]) {
            tdata.lazyLoadCol(col);
            let fval = tdata.fvals[col];
            if (usealpha) {
              let uval = tdata.uvals[col];
              const type = tdata.vsetlen[col] <= 255 ? Uint8Array : Uint16Array;
              const iarr = new type(uval.length);
              fval = iarr;
            }
            tdata.attcols[col] = new THREE.BufferAttribute(fval, 1);
          }
          particles.geometry.setAttribute("field" + i, tdata.attcols[col]);
          const r = tdata.ranges[col];
          if (usealpha)
            vmap[i].set(tdata.vsetlen[col] / 2, 2 / tdata.vsetlen[col]);
          else
            vmap[i].set(r.mean, 1 / (1.5 * r.sd));
        } else {
          vmap[i].x = 1e40;
        }
      }
      ggb().renderer.domElement.addEventListener("mousedown", mousedown);
    } else {
      particles.material = particles.defaultMaterial;
      particles.onBeforeRender = () => {
      };
      mouseup({buttons: 0});
      ggb().renderer.domElement.removeEventListener("mousedown", mousedown);
      ggb().controls.enabled = true;
    }
    E.xshaderbox.checked = !!cols;
    makeshowxmat();
  }
  async function modXShader(i, col) {
    cols[i] = col;
    useXShader(cols);
  }
  var lastx = Infinity;
  var lasty;
  function mousemove(e2) {
    const dx = e2.clientX - lastx, dy = e2.clientY - lasty;
    lastx = e2.clientX;
    lasty = e2.clientY;
    const k = [0, 2, 3, 4, 5, 3, 4, 5];
    const i = k[e2.buttons] || 2;
    xmat.applyrotr(0, i, dx * mouserot);
    xmat.applyrotr(1, i, -dy * mouserot);
    showxmat();
  }
  function mousedown(e2) {
    if (lastx === Infinity) {
      ggb().renderer.domElement.addEventListener("mousemove", mousemove);
      ggb().renderer.domElement.addEventListener("mouseup", mouseup);
    }
    lastx = e2.clientX;
    lasty = e2.clientY;
  }
  function mouseup(e2) {
    if (e2.buttons === 0) {
      ggb().renderer.domElement.removeEventListener("mousemove", mousemove);
      ggb().renderer.domElement.removeEventListener("mouseup", mouseup);
      lastx = Infinity;
    }
  }
  var makeshowxmatdone = false;
  function showxmat() {
    if (!makeshowxmatdone)
      makeshowxmat();
    const gamma = uniforms.gamma.value;
    for (let row = 0; row < ND; row++) {
      let xr, xg, xb;
      for (let col = 0; col < ND + 1; col++) {
        const v = xmat.m[row * ND + col];
        let [r, g, b] = [0, 0, 0];
        if (col == 3)
          r = xr = (v + 0.1) ** gamma * 255;
        else if (col == 4)
          g = xg = (v + 0.1) ** gamma * 255;
        else if (col == 5)
          b = xb = (v + 0.1) ** gamma * 255;
        else if (col == 6)
          [r, g, b] = [xr, xg, xb];
        else {
          r = v > 0 ? 0 : -v * 255;
          g = v > 0 ? v * 255 : 0;
        }
        E[`xmat${col}_${row}`].style.backgroundColor = `rgb(${r},${g},${b})`;
      }
    }
    E.xmat_det.innerHTML = xmat.det();
  }
  function makeshowxmat() {
    const tab = ["<table>"];
    tab.push("<row><th>" + "x y z r g b rgb ".split(" ").join("</th><th>") + "</th></row>");
    const gamma = uniforms.gamma.value;
    for (let row = 0; row < ND; row++) {
      const rows = [];
      rows.push(`<tr>`);
      for (let col = 0; col < ND + 1; col++) {
        rows.push(`<td id="xmat${col}_${row}" onclick="GG.xshader.xclick(${col},${row})"></td>`);
      }
      rows.push(`<td>${cols[row]}</td></tr>`);
      tab.push(rows.join(""));
    }
    tab.push("</table>");
    E.colkey.innerHTML = tab.join("\n") + `<br>det=<span id="xmat_det">?</span>`;
    E.colkey.style.userSelect = "none";
    makeshowxmatdone = true;
  }
  function getm(col, row) {
    return checklist[col + "_" + row];
  }
  function setm(col, row, checkv) {
    const r = getm(col, row);
    const k = col + "_" + row;
    if (checkv !== void 0) {
      checklist[k] = checkv;
    } else {
      delete checklist[k];
    }
    E[`xmat${k}`].innerHTML = checkv > 0 ? "+" : checkv < 0 ? "-" : checkv === 0 ? "." : "";
    return r;
  }
  function usecheck() {
    const d = 0.01;
    const o2 = xmat.m;
    for (const x in checklist) {
      const col = +x[0];
      const row = +x[2];
      const v = checklist[x];
      o2[col + row * ND] = v;
    }
    console.log("=-=-=-before orth", xmat.det());
    for (let i = 0; i < 10; i++)
      xmat.toOrth();
    console.log("=-=-=-after orth", xmat.det());
  }
  function xclick(col, row) {
    lastxmat.copy(xmat);
    if (col >= ND)
      return;
    const nowchecked = !getm(col, row);
    let orow = -1, ocol = -1, ovrow, ovcol, tv;
    if (nowchecked) {
      for (let k = 0; k < ND; k++) {
        if (tv = setm(col, k, void 0)) {
          orow = k;
          ovrow = tv;
        }
        if (tv = setm(k, row, void 0)) {
          ocol = k;
          ovcol = tv;
        }
      }
      if (orow !== -1 && ocol !== -1)
        setm(ocol, orow, -ovrow * ovcol);
    }
    setm(col, row, nowchecked ? 1 : void 0);
    for (let col2 = 0; col2 < ND; col2++) {
      for (let row2 = 0; row2 < ND; row2++) {
        if (!getm(col2, row2))
          setm(col2, row2, void 0);
      }
    }
    for (let col2 = 0; col2 < ND; col2++) {
      for (let row2 = 0; row2 < ND; row2++) {
        if (getm(col2, row2)) {
          for (let cc = 0; cc < ND; cc++)
            if (cc !== col2)
              setm(cc, row2, 0);
          for (let rr = 0; rr < ND; rr++)
            if (rr !== row2)
              setm(col2, rr, 0);
        }
      }
    }
    usecheck();
  }
  function setobj(to, from) {
    for (const x in to)
      delete to[x];
    Object.assign(to, from);
  }

  // tdata.js
  var tdata_exports = {};
  __export(tdata_exports, {
    TData: () => TData,
    _baseiNaN: () => _baseiNaN
  });
  var import_basic = require_basic();
  var import_basic2 = require_basic();
  "use strict";
  window.lastModified.tdata = `Last modified: 2021/03/11 15:28:37
`;
  console.log(">>>>xyz.js");
  var {E: E2, X: X4} = window;
  var XLSX;
  (0, import_basic.addFileTypeHandler)(".csv", csvReader);
  (0, import_basic.addFileTypeHandler)(".txt", csvReader);
  (0, import_basic.addFileTypeHandler)(".xlsx", csvReader);
  (0, import_basic.addFileTypeHandler)(".yaml", csvReader);
  var binnop = () => {
  };
  binnop.rawhandler = true;
  binnop.hidden = true;
  (0, import_basic.addFileTypeHandler)(".colbin", binnop);
  function csvReader(data, fid) {
    return new XYZ(data, fid);
  }
  csvReader.rawhandler = true;
  var _TData = class {
    constructor(data, fid) {
      this.fid = fid;
      this.pendread = {};
      this.xyzs = [];
      this.fvals = {}, this.uvals = {};
      this.attcols = {};
      this.vset = {};
      this.vsetlen = {};
      this.vseti = {};
      this.n = 0;
      this.ranges = {};
      this._vsetlen = [];
      this._vset = [], this._colf32 = [], this._colsu32 = [], this._colnstrs = [];
      this._colnnull = [];
      this._colnnum = [];
      _TData.tdatas[fid] = this;
      if (!data)
        return;
      this.csvReader(data, fid);
    }
    static get(data, fid, xyz) {
      let tdata = data instanceof _TData ? data : data && data.tdata || _TData.tdatas[fid];
      if (!tdata)
        tdata = new _TData(data, fid);
      _TData.tdatas[fid] = tdata;
      tdata.xyzs.push(xyz);
      return tdata;
    }
    val(name, i) {
      const nc = this.fvals[name];
      if (!nc) {
        if (name === "_tdata")
          return this;
        this.lazyLoadCol(name);
        return NaN;
      }
      const rv = nc[i];
      if (!isNaN(rv))
        return rv;
      const k = this.uvals[name][i] - _baseiNaN;
      if (k === -15)
        return "";
      return this.vseti[name][k];
    }
    async xlsxReader(raw, fid) {
      if (!XLSX) {
        await (0, import_basic2.addscript)("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.14.3/xlsx.full.min.js");
        console.log("loaded", XLSX);
      }
      let workbook = XLSX.read(raw, {type: "binary"});
      let firstSheet = workbook.SheetNames[0];
      let ss = workbook.Sheets[firstSheet];
      this.extocsv = XLSX.utils.sheet_to_csv(ss);
      return this.csvReader(this.extocsv, fid + "!");
    }
    async lazyLoadCol(id) {
      let step = 2 * 1024 * 1024;
      const t = this.fvals[id];
      if (t) {
        while (this.pendread[id] !== this.n)
          await (0, import_basic.sleep)(100);
        return t;
      }
      if (!this.ranges[id]) {
        if (id === "id") {
          this.fvals[id] = new Float32Array(this.n);
          this.fvals[id].forEach((x, i, a) => a[i] = i);
          this.pendread[id] = this.n;
          return;
        }
        const msg = `lazyLoadCol cannot load column ${id}, not a known column`;
        console.error(msg);
        throw new Error(msg);
      }
      const fid = this.bfid + "_" + id + ".colbin";
      let fbuff = this.fvals[id] = new Float32Array(this.n);
      this.uvals[id] = new Uint32Array(fbuff.buffer);
      const u8buff = new Uint8Array(fbuff.buffer);
      const usealpha = this.ranges[id].numStrs > this.ranges[id].numNum;
      const kk = "ll " + id;
      this.pendread[id] = 0;
      console.time(kk);
      let stream;
      if (fid.startsWith(",,") || fid.startsWith("..") || fid.startsWith("/remote/")) {
        console.timeLog(kk, "use server");
        let xfid = fid;
        if (import_basic.queryVariables.nodatacache)
          xfid += "?" + Date.now();
        const resp = await fetch(xfid);
        console.timeLog(kk, "await fetch done");
        if (resp.status !== 200)
          throw new Error(`Column data ${id} not available: rc=${resp.status}<br>${fid}`);
        stream = resp.body;
      } else if (import_basic.readyFiles[fid]) {
        stream = import_basic.readyFiles[fid].stream();
      } else if (import_basic.availableFileList[fid]) {
        const makeFile = (fileEntry) => new Promise((resolve) => fileEntry.file(resolve));
        import_basic.readyFiles[fid] = await makeFile(import_basic.availableFileList[fid]);
        stream = import_basic.readyFiles[fid].stream();
      } else {
        throw new Error("no ready file " + fid);
      }
      const reader = stream.getReader();
      let p = 0, p4 = 0;
      let np = 0, np4 = 0;
      let ut = 0;
      const updateInterval = 1e3;
      const att = this.attcols[id];
      while (true) {
        const {done, value} = await reader.read();
        if (done)
          break;
        const u8seg = new Uint8Array(value.buffer);
        u8buff.set(u8seg, p);
        np = p + u8seg.length;
        p4 = Math.floor(p / 4);
        np4 = Math.floor(np / 4);
        if (att) {
          if (usealpha) {
            const uval = this.uvals[id];
            const iarr = att.array;
            for (let n = p4; n < np4; n++)
              iarr[n] = uval[n] - _baseiNaN;
          }
          const t2 = Date.now();
          if (t2 - ut > updateInterval) {
            att.needsUpdate = true;
            ut = t2;
          }
        }
        p = np;
        this.pendread[id] = np4;
        this.showpendread();
      }
      if (att)
        att.needsUpdate = true;
      console.timeLog(kk, "lazyLoad complete");
      console.timeEnd(kk);
    }
    async testLazyLoad() {
      this.fvals = {};
      this.pendread = {};
      for (const h of this.header)
        this.lazyLoadCol(h);
    }
    async yamlReader(raw, fid) {
      this.prep();
      const yaml = typeof raw === "string" ? raw : await raw.text();
      const y = X4.jsyaml.safeLoad(yaml);
      this.header = y.header;
      this.vset = y.vset || y.namevset;
      this.ranges = y.ranges;
      this.n = y.n;
      const {vset, vseti, header, vsetlen} = this;
      for (const n in vset) {
        vseti[n] = Object.keys(vset[n]);
        vsetlen[n] = vseti[n].length;
      }
      if (this.ranges[header[0]].numStrs === void 0) {
        for (let i = 0; i < header.length; i++) {
          const h = header[i];
          this.ranges[h].numStrs = y.namecolnstrs ? y.namecolnstrs[h] : y.colnstrs[i];
          this.ranges[h].numNum = y.namecolnnum ? y.namecolnnum[h] : y.colnnum[i];
          this.ranges[h].numNull = y.namecolnnull ? y.namecolnnull[h] : y.colnnull[i];
        }
      }
      this.bfid = fid.substring(0, fid.length - 5);
    }
    showpendread() {
      const all = [], some = [];
      const oldPendread_min = this.pendread_min;
      this.pendread_min = this.n;
      for (const col in this.pendread) {
        const p = this.pendread[col];
        if (p === this.n) {
          all.push(col);
        } else {
          some.push(`<br>${col}=${(p * 100 / this.n).toFixed()}%`);
          this.pendread_min = Math.min(this.pendread_min, p);
        }
      }
      E2.msgbox.innerHTML = "100%: " + all.join(" ") + some.join("");
      if (this.pendread_min === this.n && oldPendread_min !== this.n) {
        for (const xyz of this.xyzs)
          xyz.dataToMarkersGui();
      }
    }
    async csvReader(raw, fid) {
      (0, import_basic2.log)("csvReader", fid);
      if (fid.endsWith(".xlsx"))
        return this.xlsxReader(raw, fid);
      if (fid.endsWith(".yaml"))
        return await this.yamlReader(raw, fid);
      this.prep();
      var oldparse = true;
      let header;
      const me2 = this;
      if (oldparse) {
        X4.currentThreeObj = X4.currentXyz = this;
        let sep;
        const st = Date.now();
        let byteLength;
        const linex = function linex2(row, numLines, bytesProcessedSoFar, bytesReadSoFar, length) {
          byteLength = length;
          if (row.trim() === "")
            return;
          if (!sep) {
            sep = row.indexOf("	") === -1 ? "," : "	";
            header = me2.header = row.split(sep).map((x) => x.trim().toLowerCase().split(",")[0]);
            me2.addHeader(header);
            return;
          }
          const rowa = row.split(sep);
          me2.addRow(rowa);
          if (me2.n % _TData.tellUpdateInterval === 0) {
            const dt2 = ((Date.now() - st) / 1e3).toFixed();
            E2.msgbox.innerHTML = `reading file ${fid}, line ${me2.n}, bytes ${bytesProcessedSoFar} of ${length}, ${(bytesProcessedSoFar / length * 100).toFixed()}%, ${dt2} secs`;
          }
          if (me2.n % _TData.graphicsUpdateInterval === 0 || me2.n === _TData.firstUpdate) {
            (0, import_basic2.log)("reading", E2.msgbox.innerHTML);
            me2.finalize(fid, true);
          }
        };
        if (raw instanceof File) {
          console.time("oldparsestream");
          await (0, import_basic.fileReader)(raw, (0, import_basic.lineSplitter)((line, numLines, bytesProcessedSoFar, bytesReadSoFar, length) => linex(line, numLines, bytesProcessedSoFar, bytesReadSoFar, length)));
          console.timeEnd("oldparsestream");
        } else {
          console.time("oldparse");
          const length = raw.length;
          const data = raw.split("\n");
          let bytesProcessedSoFar = 0;
          for (let row of data) {
            bytesProcessedSoFar += row.length + 1;
            linex(row, me2.n, bytesProcessedSoFar, length, length);
          }
          console.timeEnd("oldparse");
        }
        const dt = ((Date.now() - st) / 1e3).toFixed();
        E2.msgbox.innerHTML = `read ${fid} lines ${me2.n}, bytes ${byteLength}, ${dt} secs`;
        setTimeout(() => E2.msgbox.innerHTML = "", 5e3);
      }
      console.time("finalize");
      me2.finalize(fid);
      console.timeEnd("finalize");
    }
    prep() {
    }
    useJson(d) {
      if (this.header)
        return;
      this.prep();
      const header = Object.keys(d[0]);
      this.addHeader(header);
      for (const o2 of d) {
        this.addRow(header.map((x) => o2[x]));
      }
      this.finalize("fromMLV");
    }
    addHeader(header) {
      header = this.header = header.map((x) => x.trim().toLowerCase().split(",")[0]);
      for (let i = 0; i < header.length; i++) {
        this._colsu32[i] = new Uint32Array(1e3);
        this._colf32[i] = new Float32Array(this._colsu32[i].buffer);
        this._vset[i] = {};
        this._vsetlen[i] = 0;
        this._colnstrs[i] = 0;
        this._colnnull[i] = 0;
        this._colnnum[i] = 0;
      }
    }
    addRow(rowa) {
      const {_colf32: _cols, header, _colsu32: _colsv} = this;
      if (!this.header) {
        this.addHeader(rowa);
        return 0;
      }
      const n = this.n;
      if (this.fid.startsWith("StarCarr")) {
        const xi = header.indexOf("x"), yi = header.indexOf("y");
        if (+rowa[xi] === 0)
          rowa[xi] = "!!!bad 0!!!";
        if (+rowa[yi] === 0)
          rowa[yi] = "!!!bad 0!!!";
      }
      const ll = this._colf32[0].length;
      if (n >= ll) {
        for (let i = 0; i < header.length; i++) {
          const na = new Uint32Array(ll * 2);
          na.set(_colsv[i]);
          _colsv[i] = na;
          _cols[i] = new Float32Array(na.buffer);
        }
      }
      for (let i = 0; i < header.length; i++) {
        let v = rowa[i];
        if (v === "") {
          this._colnnull[i]++;
          _colsv[i][n] = NaN4null;
        } else if (isNaN(v)) {
          let k = this._vset[i][v];
          if (k === void 0) {
            k = this._vset[i][v] = this._vsetlen[i];
            this._vsetlen[i]++;
          }
          this._colnstrs[i]++;
          _colsv[i][n] = k + _baseiNaN;
        } else {
          v = +v;
          this._colnnum[i]++;
          _cols[i][n] = v;
        }
      }
      this.n++;
      this.pendread_min = this.n;
      return this.n;
    }
    finalize(fid, partial = false) {
      const me2 = this;
      const {header, _colf32: _cols, fvals, _vset, vset, _vsetlen, vsetlen} = this;
      for (let i = 0; i < header.length; i++) {
        const colname = header[i];
        _cols[i] = _cols[i].slice(0, this.n);
        fvals[colname] = _cols[i];
        this.uvals[header[i]] = new Uint32Array(_cols[i].buffer);
        vset[colname] = _vset[i];
        vsetlen[colname] = _vsetlen[i];
        this.vseti[colname] = Object.keys(_vset[i]);
        if (!this.ranges[colname])
          this.ranges[colname] = {};
        const r = this.ranges[colname];
        r.numStrs = this._colnstrs[i];
        r.numNum = this._colnnum[i];
        r.numNull = this._colnnull[i];
      }
      if (!partial) {
        delete this._colf32;
        delete this._vset;
        delete this._vsetlen;
      }
      if (!partial) {
        Object.assign(this.ranges, this.genstats());
      }
      function finish(col) {
        if (me2.header.includes(col)) {
          me2.rebase(col);
        }
      }
      if (!partial) {
        finish("x");
        finish("y");
        finish("z");
      }
      this.ranges.forEach = this.sForEach;
      for (const xyz of this.xyzs)
        xyz.finalize(fid, partial);
    }
    rebase(fn) {
      const c2 = centrerange[fn];
      const col = this.fvals[fn];
      for (let i = 0; i < col.length; i++)
        col[i] -= c2;
      this.ranges[fn] = this.genstats(fn);
    }
    sForEach(fun) {
      const s = this;
      for (let i in s) {
        const v = s[i];
        fun(v);
      }
    }
    genstats(name = void 0) {
      if (!name) {
        const lranges = this.ranges;
        for (name of this.header) {
          this.genstats(name);
        }
        if (centrerange.x === Infinity && lranges.x)
          centrerange.set(lranges.x.mean, lranges.y.mean, lranges.z.mean);
        return lranges;
      }
      const data = this.fvals[name];
      let sum = 0, sum2 = 0, n = 0;
      let min = Number.POSITIVE_INFINITY;
      let max = Number.NEGATIVE_INFINITY;
      data.forEach((v) => {
        if (v == null)
          return;
        if (isNaN(v)) {
        } else {
          sum += +v;
          sum2 += v * v;
          n++;
          if (v < min)
            min = v;
          if (v > max)
            max = v;
          max = Math.max(max, v);
        }
      });
      const sd = Math.sqrt((sum2 - 1 / n * sum * sum) / n);
      Object.assign(this.ranges[name], {name, mean: sum / n, sd, mid: (min + max) / 2, range: max - min, min, max, sum, sum2, n});
      return this.ranges[name];
    }
    async savefiles(yamlonly = false) {
      const saver = import_basic.saveData;
      const {header, vset, ranges, n} = this;
      const obj = {header, vset, ranges, n};
      var yaml = X4.jsyaml.safeDump(obj, {skipInvalid: true});
      console.log("yaml size", yaml.length);
      saver(this.fid + ".yaml", yaml);
      if (yamlonly)
        return;
      for (const n2 in this.fvals) {
        await (0, import_basic.sleep)(200);
        const fid = this.fid + "_" + n2 + ".colbin";
        (0, import_basic2.log)("save", fid);
        await saver(fid, this.fvals[n2]);
      }
      (0, import_basic2.log)("saves done");
    }
    valN(f, i, sds = 1.5) {
      const r = this.ranges[f];
      return (this.fvals[f][i] - r.mean) / (r.sd * sds * 2) + 0.5;
    }
    valLH(f, i, low, high) {
      return (this.fvals[f][i] - low) / (high - low);
    }
    valE(f, i) {
      return this.uvals[f][i] - _baseiNaN;
    }
    valEN(f, i) {
      return (this.uvals[f][i] - _baseiNaN) / this.vsetlen[f];
    }
    valC(f, i) {
      return this.vseti[f][this.uvals[f][i] - _baseiNaN];
    }
    makeProxy() {
      const p = this.pvals = new Array(this.n);
      for (let i = 0; i < this.n; i++) {
        p[i] = new Proxy(this, {
          get: (targ, prop) => targ.val(prop, i)
        });
      }
      return p;
    }
    dispose() {
    }
  };
  var TData = _TData;
  __publicField(TData, "tdatas", {});
  __publicField(TData, "tellUpdateInterval", 1e4);
  __publicField(TData, "firstUpdate", 1e4);
  __publicField(TData, "graphicsUpdateInterval", 25e4);
  var _kkk = new Float32Array([NaN]);
  var _iii = new Uint32Array(_kkk.buffer);
  var _bbb = new Uint8Array(_kkk.buffer);
  var iNaN = _iii[0];
  var _baseiNaN = iNaN + 16;
  var NaN4null = iNaN + 1;

  // cols.js
  "use strict";
  window.lastModified.basic = `Last modified: 2022/07/18 11:21:56
`;
  console.log(">>>>cols.js");
  var {X: X5, E: E3} = window;
  var {jsyaml} = X5;
  var COLS = {};
  X5.COLS = COLS;
  COLS.reader = function(data, fid) {
    data = data.trim();
    let coldata;
    if (data[0] === "{")
      coldata = JSON.parse(data);
    else
      coldata = jsyaml.safeLoad(data);
    for (let setn in coldata) {
      const setv = coldata[setn];
      for (let val in setv) {
        const v = setv[val];
        const c2 = new THREE.Color(v);
        if (c2.r === void 0) {
          console.log(`bad colour ${v} for ${setn}/${val}, white used: in ${fid}`);
          c2.set("white");
        }
        setv[val] = c2;
      }
    }
    Object.assign(COLS, coldata);
    dataToMarkersGui();
  };
  COLS.autocol = function(tdata, field) {
    const nv = tdata.vseti[field];
    const nn = nv.length;
    const r = COLS[field] = {};
    const eql = eqcols.length;
    for (let i = 0; i < nn; i++) {
      const v = nv[i];
      r[v] = eqcols[Math.floor(i * eql / nn)];
    }
    COLS.show(tdata, field);
  };
  COLS.gencol = function(toset, tdata, field) {
    try {
      field = field.trim();
      if (field === "random")
        return toset + ".set(COLS.random())";
      if (field === "fixed")
        field = E3.colourpick.value;
      const range = tdata.ranges[field];
      if (range && range.numStrs > range.numNum && !COLS[field])
        COLS.autocol(tdata, field);
      if (COLS[field])
        return `${toset}.set(COLS['${field}'][xyz.tdata.val('${field}', i)])`;
      const r = tdata.ranges[field];
      if (r === void 0) {
        const c2 = new THREE.Color(field);
        if (Object.getOwnPropertyNames(c2).indexOf("r") !== -1)
          return `${toset}.setRGB(${c2.r}, ${c2.g}, ${c2.b})`;
        throw new Error(`Field "${field}" not present.`);
      }
      if (XYZ.autorange) {
        return `const _cc = (${field}+1)*0.5; ${toset}.r = _cc; ${toset}.g = 1-_cc; ${toset}.b = 1-_cc;`;
      } else {
        const low = r.mean - 2 * r.sd, high = r.mean + 2 * r.sd, range2 = high - low;
        return `${toset}.set(COLS.forrange(${field}, ${low}, ${range2}))`;
      }
    } finally {
      COLS.show(tdata, field);
    }
  };
  COLS.random = function() {
    const r = Math.random;
    return COLS._colobj.setRGB(r(), r(), r());
  };
  COLS._colobj = new THREE.Color("white");
  COLS.forrange = function(v, low, range) {
    const vv = (v - low) / range;
    return COLS._colobj.setRGB(vv, 1 - vv, 1 - vv);
  };
  COLS.writer = async function(fid = "test") {
    if (!fid.endsWith(".cols"))
      fid += ".cols";
    const d = {};
    const ns = X5.currentXyz.tdata.vseti;
    const choose = Object.keys(THREE.Color.NAMES);
    for (const fname in ns) {
      const vs = ns[fname];
      if (vs.length === 0)
        continue;
      const dd = d[fname] = {};
      for (const val of vs) {
        dd[val] = choose[Math.floor(Math.random() * choose.length)];
      }
    }
    const yaml = jsyaml.safeDump(d);
    await (0, import_basic3.saveData)(fid, yaml);
  };
  COLS.show = function(tdata = X5.currentXyz, field = X5.currentXyz.guiset.colourby) {
    const range = tdata.ranges[field];
    if (!range || range.numStrs < range.numNum) {
      E3.colkey.innerHTML = "";
      return;
    }
    let f = COLS[field];
    if (!f) {
      f = {};
    }
    let s = [];
    let i = 0;
    for (const k in f) {
      const c2 = f[k], rgb = `rgb(${c2.r * 255}, ${c2.g * 255}, ${c2.b * 255})`;
      s.push(`<tr><td>${k}</td><td style=" background-color: ${rgb}">&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>`);
      if (i++ > 80)
        break;
    }
    E3.colkey.innerHTML = `<table><tbody><colgroup><col style="max-width: 4em"><col style="width: 2em"></colgroup>${s.join("")}</tbody></table>`;
  };
  COLS.set = function(f, fixed) {
    if (E3.xshaderbox.checked) {
      X5.currentXyz.setField("MD", f);
      useXShader();
      return;
    }
    if (E3.colourby.value !== f)
      E3.colourby.value = fixed ? "fixed" : f;
    const ofilt = "\n" + E3.filterbox.value + "\n";
    let g = ofilt.match(/^(.*)\nCOL:(.*?)\n(.*)/s);
    if (g)
      E3.filterbox.xvalue = `${g[1]}
COL:${f}
${g[3]}`.trim();
    else
      E3.filterbox.xvalue = `COL:${f}
${ofilt}`.trim();
    dataToMarkersGui();
  };
  (0, import_basic3.addFileTypeHandler)(".cols", COLS.reader);

  // photoshader.js
  var photoshader_exports = {};
  __export(photoshader_exports, {
    photoShader_clicked: () => photoShader_clicked
  });
  "use strict";
  var {E: E4, X: X6} = window;
  var photos;
  function photoShader(fid = "../xyz/sprites/mut-64-64-r90.jpg", xres = void 0, yres = void 0) {
    const vertexShader = `
/*
precision highp float;
precision highp int;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
*/
attribute vec3 color;
uniform float size;
varying vec3 vColor;

void main() {
    vColor.xyz = color.xyz;
    vec3 transformed = vec3( position );

    vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = size / - mvPosition.z ;
}
`;
    const fragmentShader = `
/*
precision highp float;
precision highp int;
*/
varying vec3 vColor;
// uniform mat3 uvTransform;
uniform sampler2D map;
uniform vec2 photonum;  // number of photos in each direction
uniform float discardval;

void main() {
    vec2 uv = ( /** uvTransform * **/ vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;  // 0..1
    float id = vColor.x;                            // temp code using x from colour to choose id, range 0..1
    id = floor(id * photonum.x * photonum.y);       // to integer range
    float idx = mod(id, photonum.x) / photonum.x;   //
    float idy = floor(id / photonum.x) / photonum.y;
    uv = vec2(idx, idy) + uv / photonum;

    vec4 mapTexel = texture2D( map, uv );
    vec4 diffuseColor = mapTexel;
    // diffuseColor += vec4(1);  // test
    // diffuseColor.rgb *= vColor;  // do not use vColour for now
    if ( dot(diffuseColor.rgb, vec3(1)) <= discardval ) discard; //
    gl_FragColor = sqrt(diffuseColor);
}
    `;
    var textureLoader = new THREE.TextureLoader();
    photos = textureLoader.load(fid);
    const uniforms3 = {
      map: {value: photos},
      photonum: {value: new THREE.Vector2(128, 128)},
      discardval: {value: 0.01},
      size: {value: 500}
    };
    const rr = fid.split("-");
    uniforms3.photonum.value.x = +(xres || rr[1] || 128);
    uniforms3.photonum.value.y = +(yres || rr[2] || 128);
    const shader3 = new THREE.ShaderMaterial({vertexShader, fragmentShader, uniforms: uniforms3});
    return shader3;
  }
  var nophotomaterial;
  var photomaterial;
  function photoShader_clicked(evt) {
    const ele = evt ? evt.srcElement : E4.photoscheck;
    const particles = X6.currentXyz.particles;
    if (!nophotomaterial)
      nophotomaterial = particles.material;
    if (ele.checked) {
      particles.material = photomaterial = photomaterial || photoShader();
    } else {
      particles.material = nophotomaterial;
    }
  }

  // lasso.js
  var lasso_exports = {};
  __export(lasso_exports, {
    Lasso: () => Lasso
  });
  "use strict";
  var {X: X7} = window;
  var startx;
  var lastx2;
  var starty;
  var lasty2;
  var sv3 = new THREE.Vector3();
  var Lasso = class {
    constructor(gb) {
      this._gb = gb;
      this.flag = void 0;
      this.lassos = [];
      const self = this;
      this.rmousedown = (e2) => self.mousedown(e2);
      this.rmousemove = (e2) => self.mousemove(e2);
      this.rmouseup = () => self.mouseup();
      this.rdblclick = () => self.dblclick();
    }
    get gb() {
      return X7.currentXyz.gb;
    }
    mousedown(e2) {
      startx = lastx2 = e2.offsetX, starty = lasty2 = e2.offsetY;
      this.gb.renderer.domElement.addEventListener("mousemove", this.rmousemove);
      this.gb.renderer.domElement.addEventListener("mouseup", this.rmouseup);
      e2.preventDefault();
    }
    setrun(c2) {
      c2 ? this.start() : this.stop();
    }
    paint(x1, y1, x2, y2, x3, y3, v = 255, type = "xor") {
      const {size, map, mapt} = this.lassos[0];
      const miny = Math.min(y1, y2, y3), maxy = Math.max(y1, y2, y3);
      for (let y = Math.ceil(miny); y < Math.ceil(maxy); y++) {
        let minx = Infinity, maxx = -Infinity;
        if (y1 < y && y <= y2 || y1 >= y && y > y2) {
          let x = x1 + (x2 - x1) * (y - y1) / (y2 - y1);
          minx = Math.min(minx, x);
          maxx = Math.max(maxx, x);
        }
        if (y1 < y && y <= y3 || y1 >= y && y > y3) {
          let x = x1 + (x3 - x1) * (y - y1) / (y3 - y1);
          minx = Math.min(minx, x);
          maxx = Math.max(maxx, x);
        }
        if (y2 < y && y <= y3 || y2 >= y && y > y3) {
          let x = x2 + (x3 - x2) * (y - y2) / (y3 - y2);
          minx = Math.min(minx, x);
          maxx = Math.max(maxx, x);
        }
        for (let x = Math.ceil(minx); x < Math.ceil(maxx); x++) {
          const o2 = (size.y - y) * size.x + x;
          if (type === "xor")
            map[o2] ^= v;
          else
            map[o2] = v;
        }
      }
      mapt.needsUpdate = true;
    }
    mousemove(e2) {
      let nowx = e2.offsetX, nowy = e2.offsetY;
      const r = () => 0.5;
      let v = this.flag, type = "set";
      if (e2.ctrlKey || e2.buttons === 4)
        type = "xor";
      else if (e2.altKey || e2.buttons === 2)
        v = 0;
      this.paint(nowx, nowy + r(), lastx2, lasty2 + r(), startx, starty + r(), v, type);
      lastx2 = nowx;
      lasty2 = nowy;
      if (e2.shiftKey) {
        dataToMarkersGui();
      }
    }
    mouseup() {
      this.canvas.removeEventListener("mousemove", this.rmousemove);
      window.dispatchEvent(new Event("lassoUp"));
      dataToMarkersGui();
    }
    dblclick() {
      const {map, mapt} = this.lassos[0];
      map.fill(0);
      mapt.needsUpdate = true;
    }
    clear() {
      this.stop();
      this.lassos = [];
    }
    start(pflag = 255) {
      this.flag = pflag;
      const canvas = this.canvas = this.gb.renderer.domElement;
      canvas.addEventListener("mousedown", this.rmousedown);
      canvas.addEventListener("dblclick", this.rdblclick);
      this.gb.controls.enabled = false;
      if (this.lassos[0]) {
        this.gb.nocamscene.add(this.mesh);
        return this.gb.restoreview(this._saveview);
      }
      const size = new THREE.Vector2();
      this.gb.renderer.getSize(size);
      this.gb.setSize(size.x, size.y);
      const map = new Uint8Array(size.x * size.y);
      const mapt = new THREE.DataTexture(map, size.x, size.y, THREE.LuminanceFormat, THREE.UnsignedByteType);
      let material = new THREE.MeshBasicMaterial();
      material.transparent = true;
      material.opacity = 0.04;
      material.map = mapt;
      let geometry = new THREE.PlaneGeometry(size.x, size.y);
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(size.x / 2, size.y / 2, 0);
      this.gb.nocamscene.add(this.mesh);
      const totmat = this.totmat = new THREE.Matrix4();
      const m = () => new THREE.Matrix4();
      totmat.multiply(m().makeTranslation(size.x / 2, size.y / 2, 0));
      totmat.multiply(m().makeScale(size.x / 2, size.y / 2, 0));
      totmat.multiply(this.gb.camera.projectionMatrix);
      totmat.multiply(this.gb.camera.matrixWorldInverse);
      totmat.multiply(this.gb.maingroup.matrixWorld);
      this._saveview = this.gb.saveview();
      this.lassos.push({map, size, totmat, mapt, saveview: this._saveview});
    }
    stop() {
      this.canvas.removeEventListener("mousemove", this.rmousemove);
      this.canvas.removeEventListener("mousedown", this.rmousedown);
      this.canvas.removeEventListener("mouseup", this.rmouseup);
      this.canvas.removeEventListener("mouseup", this.rdblclick);
      this.gb.nocamscene.remove(this.mesh);
      this.gb.controls.enabled = true;
      window.dispatchEvent(new Event("lassoUp"));
      window.dispatchEvent(new Event("lassoStop"));
      dataToMarkersGui();
    }
    lassoGet(x, y, z, id = this.lassos.length - 1) {
      const l = this.lassos[id];
      if (l === void 0)
        return 255;
      const {map, size, totmat} = l;
      sv3.set(x, y, z).applyMatrix4(totmat);
      sv3.x = Math.round(sv3.x);
      sv3.y = Math.round(sv3.y);
      if (sv3.x < 0 || sv3.x >= size.x || sv3.y < 0 || sv3.y >= size.y)
        return 0;
      return map[sv3.x + sv3.y * size.x];
    }
    setColour(bool) {
      (bool ? filterAdd : filterRemove)("VX(0.5 + _L/255 * 0.5);", true);
    }
    setFilter(bool) {
      (bool ? filterAdd : filterRemove)("?_L", true);
    }
  };

  // lassoshader.js
  var lassoshader_exports = {};
  __export(lassoshader_exports, {
    uniforms: () => uniforms2,
    useLassoShader: () => useLassoShader
  });
  "use strict";
  var {X: X8} = window;
  var uniforms2;
  var shader2;
  var lastid2;
  function lassoShader(id = 0) {
    lastid2 = id;
    const vertexShader = `
/*
precision highp float;
precision highp int;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
*/
attribute vec3 color;
varying vec3 vColor;

uniform float psize;
uniform vec2 size;
uniform sampler2D map;
uniform mat4 totmat;
uniform float dofilter;
uniform float docolour;

attribute float field1;
uniform vec2 vmap1;
uniform vec3 lcol1;
uniform vec3 hcol1;
attribute float field2;
uniform vec2 vmap2;
uniform vec3 lcol2;
uniform vec3 hcol2;
attribute float field3;
uniform vec2 vmap3;
uniform vec3 lcol3;
uniform vec3 hcol3;

/** compute field normalized value for object and use associated colours to increment vColour  */
void fcol(float field, vec2 vmap, vec3 lcol, vec3 hcol) {
    if (vmap.x > 9e30) return;
    float v = clamp((field - vmap.x) * vmap.y, 0., 1.);
    vColor += mix(lcol, hcol, v);
}
void main() {
    vColor = color;
    vec3 transformed = vec3( position );

    fcol(field1, vmap1, lcol1, hcol1);
    fcol(field2, vmap2, lcol2, hcol2);
    fcol(field3, vmap3, lcol3, hcol3);

    vColor.x += float(${id});  // force recompile if new id

    // lasso
    float v;
    if (size.x > 0.) {
        vec4 sv4 = totmat * vec4(position, 1);
        vec2 sv2 = sv4.xy / sv4.w / size;
        v = texture2D(map, sv2).x;
    } else {
        v = 1.0;
    }

    if (dofilter != 0. && v == 0.) transformed = vec3(1e20);
    vColor *= (1. - docolour + v*docolour);

    vec4 mvPosition = modelViewMatrix * vec4( transformed, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = psize / - mvPosition.z ;
}
`;
    const fragmentShader = `
/*
precision highp float;
precision highp int;
*/
varying vec3 vColor;
uniform float gamma;

void main() {
    // vec2 uv = ( /** uvTransform * **/ vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;  // 0..1
    // float id = vColor.x;                            // temp code using x from colour to choose id, range 0..1
    // id = floor(id * lassonum.x * lassonum.y);       // to integer range
    // float idx = mod(id, lassonum.x) / lassonum.x;   //
    // float idy = floor(id / lassonum.x) / lassonum.y;
    // uv = vec2(idx, idy) + uv / lassonum;

    // vec4 mapTexel = texture2D( map, uv );
    vec4 diffuseColor = vec4(vColor, 1.);
    gl_FragColor = pow(diffuseColor, vec4(gamma));
}
    `;
    uniforms2 = {
      gamma: {value: 0.5},
      map: {value: void 0},
      totmat: {value: new THREE.Matrix4()},
      size: {value: new THREE.Vector2(100, 100)},
      psize: {value: 1},
      dofilter: {value: 0},
      docolour: {value: 0.9},
      vmap1: {value: new THREE.Vector2(0, 1)},
      lcol1: {value: new THREE.Color(0, 0, 0)},
      hcol1: {value: new THREE.Color(1, 0, 0)},
      vmap2: {value: new THREE.Vector2(0, 1)},
      lcol2: {value: new THREE.Color(0, 0, 0)},
      hcol2: {value: new THREE.Color(0, 1, 0)},
      vmap3: {value: new THREE.Vector2(0, 1)},
      lcol3: {value: new THREE.Color(0, 0, 0)},
      hcol3: {value: new THREE.Color(0, 0, 1)}
    };
    shader2 = new THREE.ShaderMaterial({vertexShader, fragmentShader, uniforms: uniforms2});
    shader2.name = "lasso";
    return shader2;
  }
  async function useLassoShader(cols2, id, xyz = X8.currentXyz) {
    const tdata = xyz.tdata;
    if (cols2 === true)
      cols2 = [xyz.getField("X") || "cd3", xyz.getField("Y") || "cd4", xyz.getField("Z") || "cd16"];
    const particles = xyz.particles;
    if (cols2) {
      if (!xyz.lassoMaterial)
        xyz.lassoMaterial = lassoShader(id);
      particles.material = xyz.lassoMaterial;
      particles.onBeforeRender = () => {
        const lasso = xyz.gb.lasso.lassos[0];
        if (lasso) {
          uniforms2.map.value = lasso.mapt;
          uniforms2.totmat.value.copy(lasso.totmat);
          uniforms2.size.value.copy(lasso.size);
        } else {
          uniforms2.size.value.x = -1;
        }
      };
      for (let i = 1; i <= 3; i++) {
        const col = cols2[i - 1];
        if (col) {
          const usealpha = tdata.ranges[col].numStrs > tdata.ranges[col].numNum;
          if (!tdata.attcols[col]) {
            await tdata.lazyLoadCol(col);
            let namecol = tdata.fvals[col];
            if (usealpha) {
              let uval = tdata.uvals[col];
              const type = tdata.vsetlen[col] <= 255 ? Uint8Array : Uint16Array;
              const iarr = new type(uval.length);
              iarr.forEach((v, n) => iarr[n] = uval[n] - _baseiNaN);
              namecol = iarr;
            }
            tdata.attcols[col] = new THREE.BufferAttribute(namecol, 1);
          }
          particles.geometry.setAttribute("field" + i, tdata.attcols[col]);
          const r = tdata.ranges[col];
          if (usealpha)
            uniforms2["vmap" + i].value.set(0, 1 / tdata.vsetlen[col]);
          else
            uniforms2["vmap" + i].value.set(r.mean - 1.5 * r.sd, 1 / 3 / r.sd);
        } else {
          uniforms2["vmap" + i].value.x = 1e40;
        }
      }
    } else {
      particles.material = xyz.defaultMaterial;
      particles.onBeforeRender = () => {
      };
    }
    E.lassoshaderbox.checked = !!cols2;
  }

  // raycast.js
  var raycast_exports = {};
  __export(raycast_exports, {
    enableRaycast: () => enableRaycast
  });
  "use strict";
  var {E: E5, X: X9} = window;
  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var lastface;
  var lastcol;
  var lastint0;
  function enableRaycast(bool) {
    const f = bool ? document.addEventListener : document.removeEventListener;
    f("mousemove", onMouseMove);
    f("click", onMouseMove);
  }
  function onMouseMove(event) {
    if (event.target !== E5.xyzcanvas || !(event.ctrlKey || event.type === "click"))
      return;
    mouse.x = event.offsetX / E5.xyzcanvas.style.width.replace("px", "") * 2 - 1;
    mouse.y = -(event.offsetY / E5.xyzcanvas.style.height.replace("px", "")) * 2 + 1;
    raycaster.setFromCamera(mouse, ggb().camera);
    const th = X9.raywidth || 0.2;
    raycaster.params.Points.threshold = th;
    raycaster.params.Line.threshold = th;
    console.time("raycast");
    const visibles = [];
    ggb().maingroup.traverseVisible((v) => visibles.push(v));
    var intersects = raycaster.intersectObjects(visibles, false);
    console.timeEnd("raycast");
    const num = intersects.length;
    intersects = intersects.splice(0, 10);
    E5.msgbox.innerHTML = `hits ${num} shown ${intersects.length}. Hover for details.<br>`;
    let int0 = intersects[0];
    let newface = int0 && int0.face;
    if (newface != lastface) {
      if (lastface) {
        lastface.color.copy(lastcol);
        lastint0.object.geometry.colorsNeedUpdate = true;
      }
      if (newface) {
        lastcol = newface.color.clone();
        newface.color.setRGB(1, 1, 0);
        int0.object.geometry.colorsNeedUpdate = true;
        if (newface.chainset) {
          const chainsa = Array.from(newface.chainset);
          E5.filterbox.xvalue = "?[" + chainsa + "].includes(chainn)";
        }
      } else {
        E5.filterbox.xvalue = "";
      }
      dataToMarkersGui();
    }
    lastface = newface;
    lastint0 = int0;
    intersects.forEach(function(ii) {
      const xyz = ii.object.xyz;
      let frow;
      if (xyz) {
        const s = [];
        const ind = ii.index;
        for (const name in xyz.tdata.fvals) {
          const v = xyz.tdata.val(name, ind);
          if (typeof v !== "object")
            s.push(name + ": " + v);
        }
        frow = s.join("<br>");
      } else {
        frow = "no detailed information";
      }
      const indshow = ii.face ? ii.faceIndex : ii.index;
      E5.msgbox.innerHTML += `<span>${ii.object.name}:${indshow} ${ii.point.x.toFixed()}, ${ii.point.y.toFixed()}, ${ii.point.z.toFixed()}</span>
            <span class="help">${frow}</span><br>
        `;
    });
    if (lastface && !intersects.length) {
      lastface.color.copy(lastface.ocol);
      E5.filterbox.xvalue = "";
      dataToMarkersGui();
      lastface = void 0;
    }
  }

  // speech.js
  var log3 = console.log;
  var msgfix = console.log;
  var SpeechRecognition;
  SpeechRecognition = SpeechRecognition || window.webkitSpeechRecognition;
  var OrganicSpeechF = function() {
    let me2 = this;
    let recognition;
    function init() {
      recognition = new SpeechRecognition();
      recognition.maxAlternatives = 3;
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.onstart = () => {
        st = 0;
      };
      recognition.onend = () => {
        recognition.start();
      };
      recognition.onerror = (event) => {
        if (event.error !== "no-speech")
          log3("recognition error", event.error);
      };
      var st = 0, newsoundt = 0;
      recognition.onresult = function(event) {
        const commands = OrganicSpeech.commands;
        let ll, dt;
        if (!st) {
          st = Date.now();
          ll = [];
          dt = 0;
        } else {
          dt = Date.now() - st;
          ll = ["~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ " + dt];
        }
        let done = 0;
        for (const results of event.results) {
          if (results.isFinal && newsoundt) {
            log3("newsound to final", Date.now() - newsoundt);
            newsoundt = 0;
          }
          if (!results.isFinal && !newsoundt) {
            if (OrganicSpeech.commands.newsound)
              OrganicSpeech.commands.newsound();
            log3("###newsound###");
            newsoundt = Date.now();
          }
          if (!results.isFinal)
            break;
          let heard = [];
          for (const result of results) {
            var rawtext = result.transcript;
            heard.push(rawtext);
            const ltext = rawtext.toLowerCase();
            const words = ltext.split(" ").map((x) => OrganicSpeech.replace[x] || x);
            const reptext = words.join(" ");
            if (reptext !== ltext)
              heard.push("? " + reptext);
            for (let i = 0; i < words.length; i++) {
              for (let j = i + 1; j <= words.length; j++) {
                const cmd = words.slice(i, j).join(" ");
                if (commands[cmd]) {
                  OrganicSpeech.commands[cmd]();
                  i = j - 1;
                  heard.push("> " + cmd);
                  done++;
                  break;
                }
              }
            }
            if (done)
              break;
          }
          if (results.isFinal)
            st = 0;
          if (heard.length)
            ll.push("heard: " + heard.join(" | "));
          msgfix("heard", heard.join("<br>"));
        }
        if (ll.length > 2 || st === 0)
          log3(dt, ll.join("\n"));
      };
    }
    me2._running = false;
    me2._start = function() {
      if (me2._running)
        return;
      if (!recognition)
        init();
      recognition.start();
      me2._running = true;
    };
    me2._stop = function() {
      if (!me2._running)
        return;
      recognition.onend = () => {
      };
      recognition.stop();
      recognition = void 0;
      me2._running = false;
    };
    me2.commands = {};
    me2.replace = {};
  };
  var OrganicSpeech = new OrganicSpeechF();
  Object.defineProperty(OrganicSpeech, "isRunning", {
    get: () => OrganicSpeech._running,
    set: (v) => {
      v ? OrganicSpeech._start() : OrganicSpeech._stop();
    }
  });

  // xyzspeech.js
  var xyzspeech_exports = {};
  var {E: E6} = window;
  OrganicSpeech.replace = {4: "for", fore: "for", forward: "for", forwards: "for"};
  var zoomDelta = 0.01;
  var mode = "";
  var rate = 1;
  var panrate = 0.05;
  var o = OrganicSpeech;
  var c = o.commands;
  "for back left right up down bigger smaller".split(" ").forEach((k) => c[k] = () => mode = k);
  c.stop = c.newsound = () => mode = "";
  c.faster = () => rate *= 2;
  c.slower = () => rate /= 2;
  c.elevation = () => ggb().elevation();
  c.plan = () => ggb().plan();
  c["go to centre"] = () => {
    ggb().orbcamera.position.set(0, 0, 0);
    ggb().controls.target.set(0, 0, -1);
  };
  c["go to outside"] = () => ggb().orbcamera.position.set(0, 0, 30);
  c["look at centre"] = () => ggb().controls.target.set(0, 0, 0);
  var vrmat;
  var imat = new THREE.Matrix4();
  var mat3 = new THREE.Matrix3();
  var v3 = new THREE.Vector3();
  //!! setTimeout( () => {
  GraphicsBoiler.setxyzspeechupdate(() => {
    if (!mode)
      return;
    if (ggb().renderer.xr.isPresenting && !vrmat)
      vrmat = ggb().renderer.xr.getCamera(ggb().camera).cameras[0].matrix;
    mat3.setFromMatrix4(ggb().renderer.xr.isPresenting ? vrmat : imat);
    const r = rate * panrate;
    try {
      switch (mode) {
        case "for":
          ggb().controls.pan3(v3.set(0, 0, -r).applyMatrix3(mat3));
          break;
        case "back":
          ggb().controls.pan3(v3.set(0, 0, r).applyMatrix3(mat3));
          break;
        case "left":
          ggb().controls.pan3(v3.set(-r, 0, 0).applyMatrix3(mat3));
          break;
        case "right":
          ggb().controls.pan3(v3.set(r, 0, 0).applyMatrix3(mat3));
          break;
        case "up":
          ggb().controls.pan3(v3.set(0, r, 0).applyMatrix3(mat3));
          break;
        case "down":
          ggb().controls.pan3(v3.set(0, -r, 0).applyMatrix3(mat3));
          break;
        case "bigger":
          ggb().maingroup.scale.multiplyScalar(1 + zoomDelta);
          break;
        case "smaller":
          ggb().maingroup.scale.multiplyScalar(1 - zoomDelta);
          break;
      }
    } catch (e2) {
      console.error("bad command", mode, e2);
    }
  });
  //!! }, 1000);
  E6.speechhelp.innerHTML = `
Check box for speech input.<br>
Available commands:<br>
<ul><li>
${Object.keys(c).join("</li><li>")}
</li></ul>
`;
  function touch(event) {
    if (!event || event.touches.length >= 4) {
      const s = E6.gui.style;
      const sb = E6.speechbox.style;
      if (s.fontSize) {
        s.fontSize = "";
        s.transform = "";
        s.transformOrigin = "";
        sb.transform = "";
      } else {
        s.fontSize = "40%";
        s.transform = "scale(6)";
        s.transformOrigin = "top left";
        sb.transform = "scale(2)";
        sb.transformOrigin = "top left";
      }
    }
  }
  window.document.addEventListener("touchstart", touch, false);

  // StarCarr/refit.js
  "use strict";
  var {X: X10} = window;
  var rgroups;
  var rlines;
  function refit() {
    const xyz = X10.currentXyz;
    const tdata = xyz.tdata;
    const refitcol = tdata.fvals.refit_grou;
    const xc = tdata.fvals.x, yc = tdata.fvals.y, zc = tdata.fvals.z;
    if (!refitcol) {
      setTimeout(refit, 100);
      return;
    }
    rgroups = {};
    for (let i = 0; i < refitcol.length; i++) {
      const gid = refitcol[i];
      if (isNaN(gid + xc[i] + yc[i] + zc[i]))
        continue;
      let gr2 = rgroups[gid];
      if (!gr2)
        gr2 = rgroups[gid] = {gid, sx: 0, sy: 0, sz: 0, n: 0, inds: []};
      gr2.sx += xc[i];
      gr2.sy += yc[i];
      gr2.sz += zc[i];
      gr2.n++;
      gr2.inds.push(i);
    }
    for (let g in rgroups) {
      const gr2 = rgroups[g];
      gr2.x = gr2.sx / gr2.n;
      gr2.y = gr2.sy / gr2.n;
      gr2.z = gr2.sz / gr2.n;
    }
    const vertices = [];
    const colors = [];
    for (let g in rgroups) {
      const gr2 = rgroups[g];
      const col = [Math.random(), Math.random(), Math.random()];
      const cen = new THREE.Vector3(gr2.x, gr2.y, gr2.z);
      gr2.inds.forEach((i) => {
        const dv = new THREE.Vector3(xc[i], yc[i], zc[i]);
        if (dv.z == 0)
          return;
        vertices.push(cen.x, cen.y, cen.z);
        vertices.push(xc[i], yc[i], zc[i]);
        colors.push(col[0], col[1], col[2]);
        colors.push(col[0], col[1], col[2]);
      });
    }
    const linegeom = new THREE.BufferGeometry();
    linegeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    linegeom.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
    const linemat = new THREE.LineBasicMaterial({color: 16777215, opacity: 1, linewidth: 1, vertexColors: true});
    rlines = new THREE.LineSegments(linegeom, linemat);
    ggb().addToMain(rlines, "refits");
  }

  // plugins/pdbreader.js
  var import_basic4 = require_basic();
  "use strict";
  var {E: E7} = window;
  (0, import_basic4.addFileTypeHandler)(".pdb", pdbReader);
  (0, import_basic4.addFileTypeHandler)(".vdb", pdbReader);
  var chainlines;
  var myxyz;
  function pdbReader(data, fid) {
    myxyz = new XYZ(void 0, fid);
    myxyz.makechainlines = makechainlines;
    const lines = data.split("\n");
    const format = [
      [7, 11, "atid"],
      [13, 16, "atname"],
      [17, 17, "altloc"],
      [18, 20, "resname"],
      [22, 22, "chain"],
      [23, 26, "resid"],
      [31, 38, "x"],
      [39, 46, "y"],
      [47, 54, "z"],
      [61, 66, "tempfac"],
      [99, 99, "reslen"],
      [99, 99, "resstart"],
      [99, 99, "atinres"]
    ];
    const tdata = myxyz.tdata;
    tdata.prep();
    tdata.addHeader(format.map((f) => f[2]));
    lines.forEach((l) => {
      if (l.substr(0, 4) !== "ATOM")
        return;
      const d = [];
      format.forEach((f) => {
        if (!f)
          return;
        let v = l.substring(+f[0] - 1, f[1]).trim();
        if (f[2] === "atid" && v.match(/[abcdef]/))
          v = parseInt(v, 16);
        d.push(v);
      });
      if (!(import_basic4.queryVariables.ca && d[1] !== "CA"))
        tdata.addRow(d);
    });
    E7.colourby.innerHTML += `<option value="pdbcol">pdbcol</option>`;
    tdata.finalize(fid);
    const rid = tdata.fvals.resid;
    const rlen = tdata.fvals.reslen;
    const rstart = tdata.fvals.resstart;
    const atrinres = tdata.fvals.atinres;
    const rl = [], rs = [];
    for (let i = 0; i < tdata.n; i++) {
      const v = rid[i];
      if (rs[v] === void 0) {
        rs[v] = i;
        rl[v] = 0;
      }
      rl[v]++;
    }
    for (let i = 0; i < rlen.length; i++) {
      rlen[i] = rl[rid[i]];
      rstart[i] = rs[rid[i]];
      atrinres[i] = i - rstart[i];
    }
    document.title = "xyzviewer: " + fid;
    XYZ.autorange = false;
    const r = tdata.ranges;
    const max = Math.max(r.x.range, r.y.range, r.z.range);
    const ggg = ggb();
    ggg.defaultDistance = max * 2;
    ggg.camera.far = max * 5;
    ggg.camera.updateProjectionMatrix();
    ggg.outerscene.fog.density = 1 - 0.5 ** (1 / ggg.defaultDistance);
    ggg.defaultFov = 50;
    ggg.home();
    myxyz.setPointSize(2);
    myxyz.dataToMarkersGui();
    return myxyz;
  }
  async function makechainlines(pfilterfun = E7.filterbox.value, maxd2 = 800) {
    if (chainlines && chainlines.visible === false)
      return;
    const tdata = myxyz.tdata;
    if (!tdata.fvals)
      return;
    const filterfun = await myxyz.makefilterfun(pfilterfun, E7.filterbox);
    var geom = new THREE.BufferGeometry(), vertices = [], colors = [];
    const linemat = new THREE.LineBasicMaterial({color: 16777215, opacity: 1, linewidth: 1, vertexColors: true});
    if (!chainlines) {
      chainlines = new THREE.LineSegments(geom, linemat);
      ggb().addToMain(chainlines, "chainlines");
    }
    const xc = tdata.fvals["x"], yc = tdata.fvals["y"], zc = tdata.fvals["z"];
    for (let i = 0; i < tdata.n - 1; i++) {
      if (myxyz.tdata.val("chain", i) !== myxyz.tdata.val("chain", i + 1))
        continue;
      const x = xc[i], y = yc[i], z = zc[i];
      const x1 = xc[i + 1], y1 = yc[i + 1], z1 = zc[i + 1];
      if (maxd2 && (x - x1) ** 2 + (y - y1) ** 2 + (z - z1) ** 2 > maxd2)
        continue;
      myxyz._col.setRGB(0.3, 0.3, 0.3);
      if (filterfun) {
        if (!filterfun(myxyz, i, tdata.fvals))
          continue;
      }
      const col1 = myxyz._col.clone();
      myxyz._col.setRGB(0.3, 0.3, 0.3);
      if (filterfun) {
        if (!filterfun(myxyz, i + 1, tdata.fvals))
          continue;
      }
      const col2 = myxyz._col.clone();
      vertices.push(x, y, z, x1, y1, z1);
      colors.push(col1.r, col1.g, col1.b);
      colors.push(col2.r, col2.g, col2.b);
    }
    geom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geom.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
    chainlines.geometry = geom;
  }

  // graphicsboiler.js
  var import_basic5 = require_basic();

  // jsdeps/VRButton.js
  var VRButton = class {
    static createButton(renderer, options) {
      if (options) {
        console.error('THREE.VRButton: The "options" parameter has been removed. Please set the reference space type via renderer.xr.setReferenceSpaceType() instead.');
      }
      const button = document.createElement("button");
      function showEnterVR() {
        let currentSession = null;
        function onSessionStarted(session) {
          session.addEventListener("end", onSessionEnded);
          renderer.xr.setSession(session);
          button.textContent = "EXIT VR";
          currentSession = session;
        }
        function onSessionEnded() {
          currentSession.removeEventListener("end", onSessionEnded);
          button.textContent = "ENTER VR";
          currentSession = null;
        }
        button.style.display = "";
        button.style.cursor = "pointer";
        button.style.left = "calc(50% - 50px)";
        button.style.width = "100px";
        button.textContent = "ENTER VR";
        button.onmouseenter = function() {
          button.style.opacity = "1.0";
        };
        button.onmouseleave = function() {
          button.style.opacity = "0.5";
        };
        button.onclick = async function() {
          if (currentSession === null) {
            const gl = renderer.getContext();
            var attributes = gl.getContextAttributes();
            if (attributes.xrCompatible !== true)
              await gl.makeXRCompatible().then((x) => console.log("XR compatibility set", x));
            const sessionInit = void 0;
            navigator.xr.requestSession("immersive-vr", sessionInit).then(onSessionStarted).catch((e2) => button.textContent = e2);
          } else {
            currentSession.end();
          }
        };
      }
      function disableButton() {
        button.style.display = "";
        button.style.cursor = "auto";
        button.style.left = "calc(50% - 75px)";
        button.style.width = "150px";
        button.onmouseenter = null;
        button.onmouseleave = null;
        button.onclick = null;
      }
      function showWebXRNotFound() {
        disableButton();
        button.textContent = "VR NOT SUPPORTED";
      }
      function stylizeElement(element) {
        element.style.position = "absolute";
        element.style.bottom = "20px";
        element.style.padding = "12px 6px";
        element.style.border = "1px solid #fff";
        element.style.borderRadius = "4px";
        element.style.background = "rgba(0,0,0,0.1)";
        element.style.color = "#fff";
        element.style.font = "normal 13px sans-serif";
        element.style.textAlign = "center";
        element.style.opacity = "0.5";
        element.style.outline = "none";
        element.style.zIndex = "999";
      }
      if ("xr" in navigator) {
        button.id = "VRButton";
        button.style.display = "none";
        stylizeElement(button);
        navigator.xr.isSessionSupported("immersive-vr").then(function(supported) {
          supported ? showEnterVR() : showWebXRNotFound();
        });
        return button;
      } else {
        const message = document.createElement("a");
        if (window.isSecureContext === false) {
          message.href = document.location.href.replace(/^http:/, "https:");
          message.innerHTML = "WEBXR NEEDS HTTPS";
        } else {
          message.href = "https://immersiveweb.dev/";
          message.innerHTML = "WEBXR NOT AVAILABLE";
        }
        message.style.left = "calc(50% - 90px)";
        message.style.width = "180px";
        message.style.textDecoration = "none";
        stylizeElement(message);
        return message;
      }
    }
  };

  // jsdeps/OrbitControls.js
  var OrbitControls = function(object, domElement) {
    this.modSpeed = 1;
    this.object = object;
    this.domElement = domElement !== void 0 ? domElement : document;
    this.enabled = true;
    this.keysEnabled = true;
    this.target = new THREE.Vector3();
    this.center = this.target;
    this.noZoom = false;
    this.zoomSpeed = 1;
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.noRotate = false;
    this.rotateSpeed = 1;
    this.noPan = false;
    this.keyPanSpeed = 2;
    this.autoRotate = false;
    this.autoRotateSpeed = 2;
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;
    this.noKeys = false;
    this.keys = {LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40, HOME: 36, ESC: 27};
    this.keysdown = {};
    var scope = this;
    var EPS = 1e-6;
    var rotateStart = new THREE.Vector2();
    var rotateEnd = new THREE.Vector2();
    var rotateDelta = new THREE.Vector2();
    var panStart = new THREE.Vector2();
    var panEnd = new THREE.Vector2();
    var panDelta = new THREE.Vector2();
    var panOffset = new THREE.Vector3();
    var offset = new THREE.Vector3();
    var dollyStart = new THREE.Vector2();
    var dollyEnd = new THREE.Vector2();
    var dollyDelta = new THREE.Vector2();
    var phiDelta = 0;
    var thetaDelta = 0;
    var scale = 1;
    var pan = new THREE.Vector3();
    var lastPosition = new THREE.Vector3();
    var STATE = {NONE: -1, ROTATE: 0, DOLLY: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_DOLLY: 4, TOUCH_PAN: 5};
    var state = STATE.NONE;
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    var changeEvent = {type: "change"};
    var startEvent = {type: "start"};
    var endEvent = {type: "end"};
    this.rotateLeft = function(angle) {
      if (angle === void 0) {
        angle = getAutoRotationAngle();
      }
      thetaDelta -= angle;
    };
    this.rotateUp = function(angle) {
      if (angle === void 0) {
        angle = getAutoRotationAngle();
      }
      phiDelta -= angle;
    };
    this.panLeft = function(distance) {
      var te = this.object.matrix.elements;
      panOffset.set(te[0], te[1], te[2]);
      panOffset.multiplyScalar(-distance);
      pan.add(panOffset);
    };
    this.panUp = function(distance) {
      var te = this.object.matrix.elements;
      panOffset.set(te[4], te[5], te[6]);
      panOffset.multiplyScalar(distance);
      pan.add(panOffset);
    };
    this.panForward = function(distance) {
      var te = this.object.matrix.elements;
      panOffset.set(te[8], te[9], te[10]);
      panOffset.multiplyScalar(distance);
      pan.add(panOffset);
    };
    this.pan = function(deltaX, deltaY, deltaZ) {
      deltaZ = deltaZ || 0;
      var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
      if (scope.object.fov !== void 0) {
        var position = scope.object.position;
        var offset2 = position.clone().sub(scope.target);
        var targetDistance = offset2.length();
        targetDistance *= Math.tan(scope.object.fov / 2 * Math.PI / 180);
        scope.panLeft(2 * deltaX * targetDistance / element.clientHeight);
        scope.panUp(2 * deltaY * targetDistance / element.clientHeight);
        scope.panForward(2 * deltaZ * targetDistance / element.clientHeight);
      } else if (scope.object.top !== void 0) {
        scope.panLeft(deltaX * (scope.object.right - scope.object.left) / element.clientWidth);
        scope.panUp(deltaY * (scope.object.top - scope.object.bottom) / element.clientHeight);
        scope.panForward(deltaZ * (scope.object.top - scope.object.bottom) / element.clientHeight);
      } else {
        console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.");
      }
    };
    this.dollyIn = function(dollyScale) {
      if (dollyScale === void 0) {
        dollyScale = getZoomScale();
      }
      scale /= dollyScale;
    };
    this.dollyOut = function(dollyScale) {
      if (dollyScale === void 0) {
        dollyScale = getZoomScale();
      }
      scale *= dollyScale;
    };
    this.update = function() {
      var position = this.object.position;
      offset.copy(position).sub(this.target);
      var theta = Math.atan2(offset.x, offset.z);
      var phi = Math.atan2(Math.sqrt(offset.x * offset.x + offset.z * offset.z), offset.y);
      if (this.autoRotate) {
        this.rotateLeft(getAutoRotationAngle());
      }
      theta += thetaDelta;
      phi += phiDelta;
      phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, phi));
      phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));
      var radius = offset.length() * scale;
      radius = Math.max(this.minDistance, Math.min(this.maxDistance, radius));
      this.target.add(pan);
      offset.x = radius * Math.sin(phi) * Math.sin(theta);
      offset.y = radius * Math.cos(phi);
      offset.z = radius * Math.sin(phi) * Math.cos(theta);
      position.copy(this.target).add(offset);
      this.object.lookAt(this.target);
      thetaDelta = 0;
      phiDelta = 0;
      scale = 1;
      pan.set(0, 0, 0);
      if (lastPosition.distanceTo(this.object.position) > 0) {
        this.dispatchEvent(changeEvent);
        lastPosition.copy(this.object.position);
      }
    };
    this.reset = function() {
      state = STATE.NONE;
      this.target.copy(this.target0);
      this.update();
    };
    function getAutoRotationAngle() {
      return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed * scope.modSpeed;
    }
    function getZoomScale() {
      return Math.pow(0.95, scope.zoomSpeed * scope.modSpeed);
    }
    function onMouseDown(event) {
      if (scope.enabled === false)
        return;
      event.preventDefault();
      if (event.button === 0) {
        if (scope.noRotate === true)
          return;
        state = STATE.ROTATE;
        rotateStart.set(event.clientX, event.clientY);
      } else if (event.button === 1) {
        if (scope.noZoom === true)
          return;
        state = STATE.DOLLY;
        dollyStart.set(event.clientX, event.clientY);
      } else if (event.button === 2) {
        if (scope.noPan === true)
          return;
        state = STATE.PAN;
        panStart.set(event.clientX, event.clientY);
      }
      scope.domElement.addEventListener("mousemove", onMouseMove2, false);
      scope.domElement.addEventListener("mouseup", onMouseUp, false);
      scope.dispatchEvent(startEvent);
    }
    function onMouseMove2(event) {
      if (scope.enabled === false)
        return;
      event.preventDefault();
      var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
      if (state === STATE.ROTATE) {
        if (scope.noRotate === true)
          return;
        rotateEnd.set(event.clientX, event.clientY);
        rotateDelta.subVectors(rotateEnd, rotateStart);
        scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed * scope.modSpeed);
        scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed * scope.modSpeed);
        rotateStart.copy(rotateEnd);
      } else if (state === STATE.DOLLY) {
        if (scope.noZoom === true)
          return;
        dollyEnd.set(event.clientX, event.clientY);
        dollyDelta.subVectors(dollyEnd, dollyStart);
        if (dollyDelta.y > 0) {
          scope.dollyIn();
        } else {
          scope.dollyOut();
        }
        dollyStart.copy(dollyEnd);
      } else if (state === STATE.PAN) {
        if (scope.noPan === true)
          return;
        panEnd.set(event.clientX, event.clientY);
        panDelta.subVectors(panEnd, panStart);
        scope.pan(panDelta.x, panDelta.y);
        panStart.copy(panEnd);
      }
      scope.update();
    }
    function onMouseUp() {
      if (scope.enabled === false)
        return;
      scope.domElement.removeEventListener("mousemove", onMouseMove2, false);
      scope.domElement.removeEventListener("mouseup", onMouseUp, false);
      scope.dispatchEvent(endEvent);
      state = STATE.NONE;
    }
    function onMouseWheel(event) {
      if (scope.enabled === false || scope.noZoom === true)
        return;
      event.preventDefault();
      var delta = 0;
      if (event.wheelDelta !== void 0) {
        delta = event.wheelDelta;
      } else if (event.detail !== void 0) {
        delta = -event.detail;
      }
      if (delta > 0) {
        scope.dollyOut();
      } else {
        scope.dollyIn();
      }
      scope.update();
      scope.dispatchEvent(startEvent);
      scope.dispatchEvent(endEvent);
    }
    function onKeyDown(event) {
      scope.keysdown[event.keyCode] = true;
      scope.keysdown[String.fromCharCode(event.keyCode)] = true;
      if (event.keyCode === 27)
        scope.keysdown = {};
      scope.modSpeed = scope.keysdown[","] ? 0.1 : scope.keysdown["."] ? 10 : 1;
    }
    function onKeyUp(event) {
      scope.keysdown[event.keyCode] = false;
      scope.keysdown[String.fromCharCode(event.keyCode)] = false;
      scope.modSpeed = scope.keysdown[","] ? 0.1 : scope.keysdown["."] ? 10 : 1;
    }
    this.home = function() {
      var orbcamera = scope.object;
      var p = scope.object.position;
      scope.reset();
      const g = ggb();
      p.set(0, 0, g.defaultDistance);
      orbcamera.setRotationFromMatrix(new THREE.Matrix4());
      orbcamera.up = new THREE.Vector3(0, 1, 0);
      orbcamera.updateMatrix();
      const camera = g.camera;
      camera.fov = g.defaultFov;
      camera.updateProjectionMatrix();
      scope.update();
    };
    this.usekeys = function() {
      if (scope.keysEnabled === false || scope.noKeys === true || scope.noPan === true)
        return;
      var keysdown = scope.keysdown;
      var d = 3e-3;
      if (keysdown[scope.keys.UP]) {
        scope.pan(0, scope.keyPanSpeed * scope.modSpeed);
        scope.update();
      }
      if (keysdown[scope.keys.BOTTOM]) {
        scope.pan(0, -scope.keyPanSpeed * scope.modSpeed);
        scope.update();
      }
      if (keysdown[scope.keys.LEFT]) {
        scope.pan(scope.keyPanSpeed * scope.modSpeed, 0);
        scope.update();
      }
      if (keysdown[scope.keys.RIGHT]) {
        scope.pan(-scope.keyPanSpeed * scope.modSpeed, 0);
        scope.update();
      }
      if (keysdown[scope.keys.HOME]) {
        this.home();
      }
      if (keysdown["W"]) {
        scope.pan(0, 0, -scope.keyPanSpeed * scope.modSpeed);
        scope.update();
      }
      if (keysdown["S"]) {
        scope.pan(0, 0, scope.keyPanSpeed * scope.modSpeed);
        scope.update();
      }
      if (keysdown["A"]) {
        scope.pan(scope.keyPanSpeed * scope.modSpeed, 0, 0);
        scope.update();
      }
      if (keysdown["D"]) {
        scope.pan(-scope.keyPanSpeed * scope.modSpeed, 0, 0);
        scope.update();
      }
      if (keysdown["I"]) {
        p1(scope.rotateUp, d);
      }
      if (keysdown["K"]) {
        p1(scope.rotateUp, -d);
      }
      if (keysdown["L"]) {
        p1(scope.rotateLeft, -d);
      }
      if (keysdown["J"]) {
        p1(scope.rotateLeft, d);
      }
    };
    function p1(fun, d) {
      var p = scope.object.position;
      f.set(p.x, p.y, p.z);
      fun(d);
      scope.update();
      scope.target.add(p).sub(f);
      p.set(f.x, f.y, f.z);
      scope.update();
    }
    var f = new THREE.Vector3();
    function touchstart(event) {
      if (scope.enabled === false)
        return;
      switch (event.touches.length) {
        case 1:
          if (scope.noRotate === true)
            return;
          state = STATE.TOUCH_ROTATE;
          rotateStart.set(event.touches[0].pageX, event.touches[0].pageY);
          break;
        case 2:
          if (scope.noZoom === true)
            return;
          state = STATE.TOUCH_DOLLY;
          var dx = event.touches[0].pageX - event.touches[1].pageX;
          var dy = event.touches[0].pageY - event.touches[1].pageY;
          var distance = Math.sqrt(dx * dx + dy * dy);
          dollyStart.set(0, distance);
          break;
        case 3:
          if (scope.noPan === true)
            return;
          state = STATE.TOUCH_PAN;
          panStart.set(event.touches[0].pageX, event.touches[0].pageY);
          break;
        default:
          state = STATE.NONE;
      }
      scope.dispatchEvent(startEvent);
    }
    function touchmove(event) {
      if (scope.enabled === false)
        return;
      event.preventDefault();
      event.stopPropagation();
      var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
      switch (event.touches.length) {
        case 1:
          if (scope.noRotate === true)
            return;
          if (state !== STATE.TOUCH_ROTATE)
            return;
          rotateEnd.set(event.touches[0].pageX, event.touches[0].pageY);
          rotateDelta.subVectors(rotateEnd, rotateStart);
          scope.rotateLeft(2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed * scope.modSpeed);
          scope.rotateUp(2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed * scope.modSpeed);
          rotateStart.copy(rotateEnd);
          scope.update();
          break;
        case 2:
          if (scope.noZoom === true)
            return;
          if (state !== STATE.TOUCH_DOLLY)
            return;
          var dx = event.touches[0].pageX - event.touches[1].pageX;
          var dy = event.touches[0].pageY - event.touches[1].pageY;
          var distance = Math.sqrt(dx * dx + dy * dy);
          dollyEnd.set(0, distance);
          dollyDelta.subVectors(dollyEnd, dollyStart);
          if (dollyDelta.y > 0) {
            scope.dollyOut();
          } else {
            scope.dollyIn();
          }
          dollyStart.copy(dollyEnd);
          scope.update();
          break;
        case 3:
          if (scope.noPan === true)
            return;
          if (state !== STATE.TOUCH_PAN)
            return;
          panEnd.set(event.touches[0].pageX, event.touches[0].pageY);
          panDelta.subVectors(panEnd, panStart);
          scope.pan(panDelta.x, panDelta.y);
          panStart.copy(panEnd);
          scope.update();
          break;
        default:
          state = STATE.NONE;
      }
    }
    function touchend() {
      if (scope.enabled === false)
        return;
      scope.dispatchEvent(endEvent);
      state = STATE.NONE;
    }
    this.domElement.addEventListener("contextmenu", function(event) {
      event.preventDefault();
    }, false);
    this.domElement.addEventListener("mousedown", onMouseDown, false);
    this.domElement.addEventListener("mousewheel", onMouseWheel, false);
    this.domElement.addEventListener("DOMMouseScroll", onMouseWheel, false);
    this.domElement.addEventListener("touchstart", touchstart, false);
    this.domElement.addEventListener("touchend", touchend, false);
    this.domElement.addEventListener("touchmove", touchmove, false);
    window.addEventListener("keydown", onKeyDown, false);
    window.addEventListener("keyup", onKeyUp, false);
    this.pan3 = function(x, y, z) {
      if (typeof x === "object") {
        y = x.y;
        z = x.z;
        x = x.x;
      }
      scope.panLeft(-x);
      scope.panUp(y);
      scope.panForward(z);
    };
  };
  OrbitControls.prototype = Object.create(THREE.EventDispatcher.prototype);

  // jsdeps/TrackballControls.js
  var {THREE: THREEX} = window;
  var TrackballControls = function(object, domElement) {
    var _this = this;
    var STATE = {NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM: 4, TOUCH_PAN: 5};
    this.object = object;
    this.domElement = domElement !== void 0 ? domElement : document;
    this.enabled = true;
    this.screen = {left: 0, top: 0, width: 0, height: 0};
    this.rotateSpeed = 1;
    this.zoomSpeed = 1.2;
    this.panSpeed = 0.3;
    this.noRotate = false;
    this.noZoom = false;
    this.noPan = false;
    this.noRoll = false;
    this.staticMoving = false;
    this.dynamicDampingFactor = 0.2;
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.keys = [65, 83, 68];
    this.target = new THREEX.Vector3();
    var lastPosition = new THREEX.Vector3();
    var _state = STATE.NONE, _prevState = STATE.NONE, _eye = new THREEX.Vector3(), _rotateStart = new THREEX.Vector3(), _rotateEnd = new THREEX.Vector3(), _zoomStart = new THREEX.Vector2(), _zoomEnd = new THREEX.Vector2(), _touchZoomDistanceStart = 0, _touchZoomDistanceEnd = 0, _panStart = new THREEX.Vector2(), _panEnd = new THREEX.Vector2();
    this.target0 = this.target.clone();
    this.position0 = this.object.position.clone();
    this.up0 = this.object.up.clone();
    var changeEvent = {type: "change"};
    this.handleResize = function() {
      if (_this.domElement === document) {
        _this.screen.left = 0;
        _this.screen.top = 0;
        _this.screen.width = window.innerWidth;
        _this.screen.height = window.innerHeight;
      } else {
        this.screen = _this.domElement.getBoundingClientRect();
      }
    };
    this.handleEvent = function(event) {
      if (typeof this[event.type] == "function") {
        this[event.type](event);
      }
    };
    this.getMouseOnScreen = function(clientX, clientY) {
      return new THREEX.Vector2((clientX - _this.screen.left) / _this.screen.width, (clientY - _this.screen.top) / _this.screen.height);
    };
    this.getMouseProjectionOnBall = function(clientX, clientY) {
      var mouseOnBall = new THREEX.Vector3((clientX - _this.screen.width * 0.5 - _this.screen.left) / (_this.screen.width * 0.5), (_this.screen.height * 0.5 + _this.screen.top - clientY) / (_this.screen.height * 0.5), 0);
      var length = mouseOnBall.length();
      if (_this.noRoll) {
        if (length < Math.SQRT1_2) {
          mouseOnBall.z = Math.sqrt(1 - length * length);
        } else {
          mouseOnBall.z = 0.5 / length;
        }
      } else if (length > 1) {
        mouseOnBall.normalize();
      } else {
        mouseOnBall.z = Math.sqrt(1 - length * length);
      }
      _eye.copy(_this.object.position).sub(_this.target);
      var projection = _this.object.up.clone().setLength(mouseOnBall.y);
      projection.add(_this.object.up.clone().cross(_eye).setLength(mouseOnBall.x));
      projection.add(_eye.setLength(mouseOnBall.z));
      return projection;
    };
    this.rotateCamera = function() {
      var angle = Math.acos(_rotateStart.dot(_rotateEnd) / _rotateStart.length() / _rotateEnd.length());
      if (angle) {
        var axis = new THREEX.Vector3().crossVectors(_rotateStart, _rotateEnd).normalize(), quaternion = new THREEX.Quaternion();
        angle *= _this.rotateSpeed;
        quaternion.setFromAxisAngle(axis, -angle);
        _eye.applyQuaternion(quaternion);
        _this.object.up.applyQuaternion(quaternion);
        _rotateEnd.applyQuaternion(quaternion);
        if (_this.staticMoving) {
          _rotateStart.copy(_rotateEnd);
        } else {
          quaternion.setFromAxisAngle(axis, angle * (_this.dynamicDampingFactor - 1));
          _rotateStart.applyQuaternion(quaternion);
        }
      }
    };
    this.zoomCamera = function() {
      if (_state === STATE.TOUCH_ZOOM) {
        var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
        _touchZoomDistanceStart = _touchZoomDistanceEnd;
        _eye.multiplyScalar(factor);
      } else {
        var factor = 1 + (_zoomEnd.y - _zoomStart.y) * _this.zoomSpeed;
        if (factor !== 1 && factor > 0) {
          _eye.multiplyScalar(factor);
          if (_this.staticMoving) {
            _zoomStart.copy(_zoomEnd);
          } else {
            _zoomStart.y += (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
          }
        }
      }
    };
    this.panCamera = function() {
      var mouseChange = _panEnd.clone().sub(_panStart);
      if (mouseChange.lengthSq()) {
        mouseChange.multiplyScalar(_eye.length() * _this.panSpeed);
        var pan = _eye.clone().cross(_this.object.up).setLength(mouseChange.x);
        pan.add(_this.object.up.clone().setLength(mouseChange.y));
        _this.object.position.add(pan);
        _this.target.add(pan);
        if (_this.staticMoving) {
          _panStart = _panEnd;
        } else {
          _panStart.add(mouseChange.subVectors(_panEnd, _panStart).multiplyScalar(_this.dynamicDampingFactor));
        }
      }
    };
    this.checkDistances = function() {
      if (!_this.noZoom || !_this.noPan) {
        if (_eye.lengthSq() > _this.maxDistance * _this.maxDistance) {
          _this.object.position.addVectors(_this.target, _eye.setLength(_this.maxDistance));
        }
        if (_eye.lengthSq() < _this.minDistance * _this.minDistance) {
          _this.object.position.addVectors(_this.target, _eye.setLength(_this.minDistance));
        }
      }
    };
    this.update = function() {
      _eye.subVectors(_this.object.position, _this.target);
      if (!_this.noRotate) {
        _this.rotateCamera();
      }
      if (!_this.noZoom) {
        _this.zoomCamera();
      }
      if (!_this.noPan) {
        _this.panCamera();
      }
      _this.object.position.addVectors(_this.target, _eye);
      _this.checkDistances();
      _this.object.lookAt(_this.target);
      if (lastPosition.distanceToSquared(_this.object.position) > 0) {
        //!!! _this.dispatchEvent( changeEvent );
        lastPosition.copy(_this.object.position);
      }
    };
    this.reset = function() {
      _state = STATE.NONE;
      _prevState = STATE.NONE;
      _this.target.copy(_this.target0);
      _this.object.position.copy(_this.position0);
      _this.object.up.copy(_this.up0);
      _eye.subVectors(_this.object.position, _this.target);
      _this.object.lookAt(_this.target);
      lastPosition.copy(_this.object.position);
    };
    function keydown(event) {
      if (_this.enabled === false)
        return;
      window.removeEventListener("keydown", keydown);
      _prevState = _state;
      if (_state !== STATE.NONE) {
        return;
      } else if (event.keyCode === _this.keys[STATE.ROTATE] && !_this.noRotate) {
        _state = STATE.ROTATE;
      } else if (event.keyCode === _this.keys[STATE.ZOOM] && !_this.noZoom) {
        _state = STATE.ZOOM;
      } else if (event.keyCode === _this.keys[STATE.PAN] && !_this.noPan) {
        _state = STATE.PAN;
      }
    }
    function keyup(event) {
      if (_this.enabled === false)
        return;
      _state = _prevState;
      window.addEventListener("keydown", keydown, false);
    }
    function mousedown2(event) {
      if (_this.enabled === false)
        return;
      event.preventDefault();
      event.stopPropagation();
      if (_state === STATE.NONE) {
        _state = event.button;
      }
      if (_state === STATE.ROTATE && !_this.noRotate) {
        _rotateStart = _this.getMouseProjectionOnBall(event.clientX, event.clientY);
        _rotateEnd.copy(_rotateStart);
      } else if (_state === STATE.ZOOM && !_this.noZoom) {
        _zoomStart = _this.getMouseOnScreen(event.clientX, event.clientY);
        _zoomEnd.copy(_zoomStart);
      } else if (_state === STATE.PAN && !_this.noPan) {
        _panStart = _this.getMouseOnScreen(event.clientX, event.clientY);
        _panEnd.copy(_panStart);
      }
      document.addEventListener("mousemove", mousemove2, false);
      document.addEventListener("mouseup", mouseup2, false);
    }
    function mousemove2(event) {
      if (_this.enabled === false)
        return;
      event.preventDefault();
      event.stopPropagation();
      if (_state === STATE.ROTATE && !_this.noRotate) {
        _rotateEnd = _this.getMouseProjectionOnBall(event.clientX, event.clientY);
      } else if (_state === STATE.ZOOM && !_this.noZoom) {
        _zoomEnd = _this.getMouseOnScreen(event.clientX, event.clientY);
      } else if (_state === STATE.PAN && !_this.noPan) {
        _panEnd = _this.getMouseOnScreen(event.clientX, event.clientY);
      }
    }
    function mouseup2(event) {
      if (_this.enabled === false)
        return;
      event.preventDefault();
      event.stopPropagation();
      _state = STATE.NONE;
      document.removeEventListener("mousemove", mousemove2);
      document.removeEventListener("mouseup", mouseup2);
    }
    function mousewheel(event) {
      if (_this.enabled === false)
        return;
      event.preventDefault();
      event.stopPropagation();
      var delta = 0;
      if (event.wheelDelta) {
        delta = event.wheelDelta / 40;
      } else if (event.detail) {
        delta = -event.detail / 3;
      }
      _zoomStart.y += delta * 0.01;
    }
    function touchstart(event) {
      if (_this.enabled === false)
        return;
      switch (event.touches.length) {
        case 1:
          _state = STATE.TOUCH_ROTATE;
          _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall(event.touches[0].pageX, event.touches[0].pageY);
          break;
        case 2:
          _state = STATE.TOUCH_ZOOM;
          var dx = event.touches[0].pageX - event.touches[1].pageX;
          var dy = event.touches[0].pageY - event.touches[1].pageY;
          _touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
          break;
        case 3:
          _state = STATE.TOUCH_PAN;
          _panStart = _panEnd = _this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY);
          break;
        default:
          _state = STATE.NONE;
      }
    }
    function touchmove(event) {
      if (_this.enabled === false)
        return;
      event.preventDefault();
      event.stopPropagation();
      switch (event.touches.length) {
        case 1:
          _rotateEnd = _this.getMouseProjectionOnBall(event.touches[0].pageX, event.touches[0].pageY);
          break;
        case 2:
          var dx = event.touches[0].pageX - event.touches[1].pageX;
          var dy = event.touches[0].pageY - event.touches[1].pageY;
          _touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);
          break;
        case 3:
          _panEnd = _this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY);
          break;
        default:
          _state = STATE.NONE;
      }
    }
    function touchend(event) {
      if (_this.enabled === false)
        return;
      switch (event.touches.length) {
        case 1:
          _rotateStart = _rotateEnd = _this.getMouseProjectionOnBall(event.touches[0].pageX, event.touches[0].pageY);
          break;
        case 2:
          _touchZoomDistanceStart = _touchZoomDistanceEnd = 0;
          break;
        case 3:
          _panStart = _panEnd = _this.getMouseOnScreen(event.touches[0].pageX, event.touches[0].pageY);
          break;
      }
      _state = STATE.NONE;
    }
    this.domElement.addEventListener("contextmenu", function(event) {
      event.preventDefault();
    }, false);
    this.domElement.addEventListener("mousedown", mousedown2, false);
    this.domElement.addEventListener("mousewheel", mousewheel, false);
    this.domElement.addEventListener("DOMMouseScroll", mousewheel, false);
    this.domElement.addEventListener("touchstart", touchstart, false);
    this.domElement.addEventListener("touchend", touchend, false);
    this.domElement.addEventListener("touchmove", touchmove, false);
    window.addEventListener("keydown", keydown, false);
    window.addEventListener("keyup", keyup, false);
    this.handleResize();
  };

  // vrcontrols.js
  var controller1;
  var controller2;
  function vrstart() {
    controller1 = ggb().renderer.xr.getController(0);
    controller1.addEventListener("selectstart", onSelectStart);
    controller1.addEventListener("selectend", onSelectEnd);
    ggb().maingroup.add(controller1);
    controller2 = ggb().renderer.xr.getController(1);
    controller2.addEventListener("selectstart", onSelectStart2);
    controller2.addEventListener("selectend", onSelectEnd2);
    ggb().outerscene.add(controller2);
  }
  var select = false;
  function onSelectStart() {
    select = true;
  }
  function onSelectEnd() {
    select = false;
  }
  function onSelectStart2() {
    controller2.attach(ggb().maingroup);
  }
  function onSelectEnd2() {
    ggb().outerscene.attach(ggb().maingroup);
  }
  function vrframe() {
    let panDelta = -0.3, zoomDelta2 = -0.01;
    const session = ggb().renderer.xr.getSession();
    if (!session || !session.inputSources || session.inputSources.length === 0)
      return;
    const igp1 = session.inputSources[0].gamepad;
    if (!select && !igp1)
      return;
    const m = controller1.matrix.elements;
    let d = panDelta;
    if (igp1 && igp1.axes && igp1.buttons[2].pressed)
      d *= -igp1.axes[1];
    else if (!select)
      d = 0;
    const c2 = ggb().controls;
    if (c2["pan3"]) {
      c2["pan3"](m[8] * d, m[9] * d, m[10] * d);
    } else {
      const oc = ggb().orbitControls;
      oc.target.copy(c2.target);
      oc.pan3(m[8] * d, m[9] * d, m[10] * d);
      c2.target.copy(oc.target);
    }
    if (session.inputSources[1]) {
      const igp2 = session.inputSources[1].gamepad;
      if (!igp2)
        return;
      if (igp2.axes && igp2.buttons[2].pressed)
        ggb().maingroup.scale.multiplyScalar(1 + zoomDelta2 * igp2.axes[1]);
    }
  }

  // graphicsboiler.js
  "use strict";
  window.lastModified.graphicsboiler = `Last modified: 2022/07/14 17:38:46
`;
  console.log(">>>>graphicsboiler.js");
  var {E: E8, X: X11, Stats} = window;
  var gbid = 0;
  function ggb() {
    return _ggb;
  }
  var _ggb;
  var _GraphicsBoiler = class {
    constructor(id = "gb" + gbid++) {
      this.id = id;
      this.framenum = 0;
      this.addvisList = {};
      this.defaultDistance = 10;
      this.defaultFov = Math.atan2(1.5, this.defaultDistance) * 360 / Math.PI;
      this.xyzcontainer = document.getElementById("xyzcontainer");
      this.nocamcamera = new THREE.OrthographicCamera(0, 200, 100, 0, -100, 100);
      this.nocamscene = new THREE.Scene();
      this.nocamscene.name = this.id + "nocamscene";
      this.autoClear = false;
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2e3);
      this.camera.name = this.id + "camera";
      this.camera.fov = this.defaultFov;
      this.camera.updateProjectionMatrix();
      this.camera.position.z = 0;
      this.controlCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2e3);
      this.controlCamera.name = this.id + "controlCamera";
      this.controlCamera.position.z = this.defaultDistance;
      this.camscene = new THREE.Scene();
      this.camscene.name = this.id + "camscene";
      this.camscene.add(this.camera);
      this.maingroup = new THREE.Group();
      this.maingroup.name = this.id + "maingroup";
      this.maingroup.rotateX(3.14159 / 2);
      this.outerscene = new THREE.Scene();
      this.outerscene.name = this.id + "outerscene";
      this.outerscene.add(this.maingroup);
      this.outerscene.fog = new THREE.FogExp2(0, 8e-4);
      this.outerscene.remove(this.light0);
      this.light0 = new THREE.DirectionalLight(col3(1, 1, 1), 1);
      this.light0.target.position.set(0, 0, 0);
      this.light0.position.set(1, 1, -1);
      this.outerscene.add(this.light0);
      this.outerscene.remove(this.light1);
      this.light1 = new THREE.DirectionalLight(col3(1, 1, 1), 1);
      this.light1.target.position.set(0, 0, 0);
      this.light1.position.set(-1, -1, 1);
      this.outerscene.add(this.light1);
      this.vrdisplay = void 0;
      this.renderer = new THREE.WebGLRenderer({antialias: false, alpha: true, preserveDrawingBuffer: false});
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.xr.enabled = true;
      this.renderer.autoClear = this.autoClear;
      this.canvas = this.renderer.domElement;
      this.xyzcontainer.appendChild(this.canvas);
      this.canvas.id = "xyzcanvas" + this.id;
      this.canvas.style.position = "fixed";
      this.canvas.style.top = "0";
      const me2 = this;
      _ggb = me2;
      this.canvas.onclick = () => {
        document.activeElement.blur();
        const av = me2.addvisList;
        if (Object.values(av).length !== 0) {
          X11.currentXyz = Object.values(av)[0].xyz;
          if (!X11.currentXyz)
            X11.currentXyz = Object.values(av)[0].obj.xyz;
        }
        _ggb = me2;
        if (X11.currentXyz)
          console.log("click", X11.currentXyz.fid, me2.id);
      };
      if (Stats) {
        this.stats = new Stats();
        this.xyzcontainer.appendChild(this.stats.dom);
        this.stats.dom.style.bottom = "0";
        this.stats.dom.style.top = "";
      }
      document.addEventListener("keydown", (e2) => this.onDocumentKeyDown(e2), false);
      this.maingroup.scale.set(1, 1, 1);
      window.addEventListener("resize", () => this.onWindowResize(), false);
      if (OrbitControls) {
        this.orbitControls = new OrbitControls(this.controlCamera, this.renderer.domElement);
        this.orbitControls.autoRotate = false;
        this.orbitControls.enabled = false;
      }
      this.setOrbitController(false);
      if (this.renderer.xr.setReferenceSpaceType)
        this.renderer.xr.setReferenceSpaceType("local");
      this.lasso = new Lasso();
      document.body.appendChild(VRButton.createButton(this.renderer));
      this.animate();
    }
    static setxyzspeechupdate(f) {
      _GraphicsBoiler.xyzspeechupdate = f;
    }
    addToMain(obj, name, parent = this.maingroup, xyz = obj) {
      parent.add(obj);
      this.addvis(obj, name, xyz);
    }
    setOrbitController(v = true) {
      if (this.controls)
        this.controls.enabled = false;
      this.controls = new (v ? OrbitControls : TrackballControls)(this.controlCamera, this.renderer.domElement);
    }
    animate() {
      this.renderer.setAnimationLoop(() => this.render());
    }
    render() {
      this.framenum++;
      if (this.stats)
        this.stats.update();
      vrframe();
      this.controls.update();
      if (this.orbitControls) {
        if (document.activeElement === document.body) {
          if (this.controls instanceof OrbitControls) {
            this.controls.usekeys();
          } else {
            this.orbitControls.target.copy(this.controls.target);
            this.orbitControls.usekeys();
            this.controls.target.copy(this.orbitControls.target);
          }
        }
        this.controlCamera.updateMatrix();
        if (_GraphicsBoiler.xyzspeechupdate)
          _GraphicsBoiler.xyzspeechupdate();
      }
      this.camscene.matrixAutoUpdate = false;
      this.camscene.matrix.fromArray(this.controlCamera.matrix.elements);
      this.camscene.matrixWorldNeedsUpdate = true;
      this.camscene.updateMatrixWorld(true);
      this.renderer.clear();
      this.renderer.render(this.outerscene, this.camera);
      if (this.nocamscene.children.length !== 0) {
        this.renderer.render(this.nocamscene, this.nocamcamera);
      }
    }
    onDocumentKeyDown(evt) {
      const k = String.fromCharCode(evt.keyCode);
      if (k === "Q")
        this.fullcanvas();
      if (evt.key === "F2") {
        this.vrdisplay.requestPresent([{source: this.renderer.domElement}]);
      }
      if (evt.key === "F4") {
        this.vrdisplay.exitPresent();
      }
    }
    fullcanvas(full = E8.info.style.display !== "none") {
      E8.info.style.display = full ? "none" : "";
      E8.ack.style.display = E8.info.style.display;
      this.canvas.focus();
    }
    onWindowResize() {
      let w, h;
      if (this.renderer.domElement.parentElement.id === "xyzcontainer") {
        w = window.innerWidth;
        h = window.innerHeight;
      } else {
        const hhh = this.renderer.domElement.parentElement;
        w = hhh.offsetWidth;
        h = hhh.offsetHeight;
      }
      this.setSize(w, h);
    }
    setBackground(r = 0, g = r, b = r, alpha = 1) {
      this.renderer.setClearColor(new THREE.Color(r, g, b));
      this.renderer.setClearAlpha(alpha);
    }
    setSize(w, h) {
      if (w[0])
        [w, h] = w;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
      this.nocamcamera.right = w;
      this.nocamcamera.top = h;
      this.nocamcamera.updateProjectionMatrix();
    }
    addvis(obj, bname, xyz) {
      let name;
      for (let i = 0; i < 20; i++) {
        name = this.id + bname + (i === 0 ? "" : "_" + i);
        if (!this.addvisList[name])
          break;
      }
      obj.name = this.id + name;
      const sfid = name.split("\\").pop().split("/").pop();
      E8.visibles.innerHTML += `
        <span id="${name}_k" onclick="currentXyz.gb.select('${name}')">${sfid}:</span>
        <span class="help">click on the item to select for filter/colour etc selection</span>
        <input type="checkbox" checked="checked" id="${name}_cb" onclick="currentXyz.gb.addvis_clicked(event)" name="${name}"/>
        <span class="help">make item visible/invisible</span>
    `;
      this.addvisList[name] = {name, sfid, obj, xyz};
      if (xyz) {
        xyz.name = this.id + name;
        xyz.sfid = sfid;
      }
    }
    select(fid, xyz) {
      if (this !== _ggb)
        return;
      for (const f in this.addvisList)
        E8[f + "_k"].style.color = f === fid ? "lightgreen" : "white";
      const avl = this.addvisList[fid];
      (0, import_basic5.log)("sselect", fid, avl);
      if (avl)
        X11.currentThreeObj = avl.obj;
      xyz = xyz || avl.xyz || avl;
      if (xyz) {
        X11.currentXyz = xyz;
        const guiset = xyz.guiset;
        if (guiset) {
          E8.colourby.value = guiset.colourby;
          E8.filterbox.xvalue = guiset.filterbox;
          E8.colourpick.value = guiset.colourpick;
          if (xyz.material)
            xyz.setPointSize(guiset.spotsize);
        }
      }
    }
    addvis_clicked(evt) {
      const src = evt.target;
      if (evt.shiftKey) {
        for (const n in this.addvisList) {
          const eele = this.addvisList[n];
          const v = n === src.name;
          document.getElementById(n + "_cb").checked = v;
          eele.obj.visible = v;
        }
        return;
      }
      const ele = this.addvisList[src.name];
      ele.obj.visible = src.checked;
    }
    scale(x, y = x, z = y) {
      this.maingroup.scale.set(x, y, z);
    }
    plan() {
      this.maingroup.rotation.set(0, 0, 0);
      this.home();
    }
    elevation() {
      this.maingroup.rotation.set(Math.PI / 2, 0, 0);
      this.home();
    }
    home() {
      if (this.controls.home)
        this.controls.home();
    }
    saveview() {
      function save(a) {
        return a.matrix.elements.slice();
      }
      this.lastsave = {
        camera: save(this.camera),
        controlCamera: save(this.controlCamera),
        mg: save(this.maingroup),
        targpos: this.controls.target.clone()
      };
      return this.lastsave;
    }
    restoreview(s = this.lastsave) {
      function rest(a, b) {
        a.matrix.elements = b.slice();
        a.matrix.decompose(a.position, a.quaternion, a.scale);
      }
      rest(this.camera, s.camera);
      rest(this.controlCamera, s.controlCamera);
      rest(this.maingroup, s.mg);
      this.controls.target.copy(s.targpos);
    }
  };
  var GraphicsBoiler = _GraphicsBoiler;
  __publicField(GraphicsBoiler, "xyzspeechupdate");
  function start() {
    console.log("document loaded");
    E8.lastmod.textContent = window.lastModified.xyzhtml;
    if (location.href.indexOf("xyz.html") !== -1) {
      _ggb = new GraphicsBoiler();
      vrstart();
    }
  }
  if (document.readyState === "complete" || document.readyState === "interactive")
    start();
  else
    document.onload = start;
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded loaded");
  });
  window.devtoolsFormatters = [{
    header: function(obj) {
      return obj.isMatrix4 ? ["div", {}, obj.toString()] : null;
    },
    hasBody: () => false
  }];
  THREE.Matrix4.prototype.toString = function(sep = "   ") {
    const mm = Array.from(this.elements).map((e2) => " " + e2.toFixed(3).replace(".000", ""));
    return "mat4:" + sep + "[" + [
      mm.slice(0, 4),
      mm.slice(4, 8),
      mm.slice(8, 12),
      mm.slice(12, 16)
    ].join(sep) + "]";
  };

  // xyz.js
  var import_basic6 = require_basic();
  var import_basic7 = require_basic();
  var import_basic8 = require_basic();
  "use strict";
  window.lastModified.xyz = `Last modified: 2022/07/18 10:55:24
`;
  console.log(">>>>xyz.js");
  var {E: E9, X: X12} = window;
  var setPointSize = (a, b) => {
    if (X12.currentXyz)
      X12.currentXyz.setPointSize(a, b);
  };
  var filtergui = (g) => {
    if (X12.currentXyz)
      X12.currentXyz.filtergui(g);
  };
  var dataToMarkersGui = (type, popping) => {
    if (X12.currentXyz)
      X12.currentXyz.dataToMarkersGui(type, popping);
  };
  var centrerange = new THREE.Vector3(Infinity);
  var badfun = () => -9999;
  var usePhotoShader;
  var _XYZ = class {
    constructor(pdata, fid, owngb) {
      X12.currentXyz = X12.currentThreeObj = this.xyz = this;
      const tdata = this.tdata = TData.get(pdata, fid, this);
      this.gb = owngb ? new GraphicsBoiler() : ggb();
      this._col = new THREE.Color(1, 1, 1);
      this._col1 = new THREE.Color(1, 1, 1);
      this._ret = new Float32Array(6);
      this._ids = void 0;
      this.fields = {};
      this._onFilter = void 0;
      this._inDataToMarkers = 0;
      this._dataToMarkersQ = [];
      this.fid = fid;
      this.makechainlines = void 0;
      this.guiset = _XYZ.baseguiset;
      this.guiset.filterbox = applyurl();
      const me2 = this;
      window.addEventListener("lassoUp", async function() {
        if (me2._onFilter) {
          const ids = await me2.getCallbacks();
          me2._onFilter(ids);
        }
      });
      if (Object.keys(tdata.xyzs).length === 0)
        this.guiset.filterbox = E9.filterbox.value;
      this.gb.select(fid, this);
      if (pdata)
        this.finalize(fid);
      if (_XYZ.constructorDone)
        _XYZ.constructorDone(this);
      document.getElementsByName("spotsize").forEach((e2) => {
        e2.onmouseenter = (e3) => setPointSize(e3, "in");
        e2.onmouseleave = (e3) => setPointSize(e3, "out");
        e2.onclick = setPointSize;
      });
    }
    finalize(fid, partial) {
      if (this.tdata.header) {
        this.headerSetup();
        this.gb.select(fid, this);
        this.dataToMarkersGui();
      } else {
        setTimeout(() => this.finalize(fid), 10);
      }
    }
    dataToMarkersGui(type = void 0, popping = false) {
      this.headerSetup();
      if (!this.group)
        this.setupGraphics();
      this.group.remove(this.lines);
      this.group.add(this.particles);
      if (E9.xshaderbox.checked) {
        useXShader();
        return;
      }
      if (X12.currentThreeObj.xyz) {
        if (type)
          E9.colourby.value = type;
        if (!this.guiset)
          this.guiset = _XYZ.baseguiset;
        Object.assign(this.guiset, {colourby: E9.colourby.value, filterbox: E9.filterbox.value, colourpick: E9.colourpick.value});
        if (this.makechainlines)
          this.makechainlines(E9.filterbox.value);
        return this.dataToMarkers(E9.filterbox.value, popping);
      } else if (X12.currentThreeObj.material) {
        X12.currentThreeObj.material.color.set(E9.colourpick.value);
      }
    }
    filter(ids) {
      console.log("filter #", Object.keys(ids).length);
      this._ids = ids;
      this.dataToMarkersGui();
    }
    hide(ids) {
      console.log("hide #", Object.keys(ids).length);
      this._ids = ids;
      this.dataToMarkersGui();
    }
    onFilter(f) {
      this._onFilter = f;
    }
    async dataToMarkers(pfilterfun, popping, cbs) {
      this._dataToMarkersQ.push({pfilterfun, popping, cbs});
      if (this._inDataToMarkers)
        return;
      this._inDataToMarkers++;
      try {
        while (true) {
          const s = this._dataToMarkersQ.shift();
          if (!s)
            break;
          ({pfilterfun, popping, cbs} = s);
          await this._dataToMarkers(pfilterfun, popping, cbs);
        }
      } finally {
        this._inDataToMarkers--;
      }
    }
    _prepcols() {
      const tdata = this.tdata;
      const xf = this.getField("X"), yf = this.getField("Y"), zf = this.getField("Z"), cf = this.getField("COL") || xf;
      tdata.lazyLoadCol(xf);
      tdata.lazyLoadCol(yf);
      tdata.lazyLoadCol(zf);
      if (cf !== "fixed" && cf !== "random")
        tdata.lazyLoadCol(cf);
      const xc = tdata.fvals[xf];
      const yc = tdata.fvals[yf];
      const zc = tdata.fvals[zf];
      const cc = tdata.fvals[cf];
      if (!xc || !yc || !zc || !cc) {
      }
      const r = tdata.ranges;
      if (xc && !r[xf].mean)
        tdata.genstats(xf);
      if (yc && !r[yf].mean)
        tdata.genstats(yf);
      if (zc && !r[zf].mean)
        tdata.genstats(zf);
      if (cc && !r[cf].mean)
        tdata.genstats(cf);
      return {tdata, xf, yf, zf, cf, xc, yc, zc, cc, r};
    }
    async _dataToMarkersFast() {
      const st = performance.now();
      const {tdata, xf, yf, zf, cf, xc, yc, zc, cc, r} = this._prepcols();
      let vert = this._svert;
      let col = this._scol;
      let ii = 0;
      const sds = 1.5;
      const xd = r[xf].mean, xs = 1 / (r[xf].sd * sds);
      const yd = r[yf].mean, ys = 1 / (r[yf].sd * sds);
      const zd = r[zf].mean, zs = 1 / (r[zf].sd * sds);
      const cd = r[cf].mean - r[cf].sd * sds, cs = 1 / (r[cf].sd * sds * 2);
      tdata.showpendread();
      const l = tdata.pendread_min;
      for (let i = 0; i < l; i++) {
        const c2 = (cc[i] - cd) * cs;
        vert[ii] = (xc[i] - xd) * xs;
        col[ii++] = c2;
        vert[ii] = (yc[i] - yd) * ys;
        col[ii++] = 1 - c2;
        vert[ii] = (zc[i] - zd) * zs;
        col[ii++] = 1 - c2;
      }
      const dt = performance.now() - st;
      E9.filtcount.innerHTML = `fast filter applied: #points=${l} of ${tdata.n}, time: ${dt}ms`;
      (0, import_basic8.log)(E9.filtcount.innerHTML);
      E9.filterbox.classList = ["_fast"];
      this.usevertcol(l, false);
    }
    async _dataToMarkers(pfilterfun = E9.filterbox.value, popping, cbs) {
      this.setupGraphics(this.fid);
      if (pfilterfun.startsWith("//fast") || import_basic7.queryVariables.fast)
        return this._dataToMarkersFast();
      const st = performance.now();
      const {tdata, xf, yf, zf, cf, xc, yc, zc, cc, r} = this._prepcols();
      const fulll = tdata.n;
      let vert = this._svert;
      let col = this._scol;
      const _namecols = tdata.fvals;
      const filterfun = await this.makefilterfun(pfilterfun, E9.filterbox, "force");
      tdata.showpendread();
      if (filterfun === badfun)
        return;
      let ii = 0;
      let noxyz = 0;
      let lines = false;
      const me2 = this;
      const q = this._ret;
      const c2 = this._col;
      const c1 = this._col1;
      const did = _namecols.id;
      const pendl = tdata.pendread_min;
      for (let i = 0; i < pendl; i++) {
        if (me2._ids !== void 0 && !me2._ids[did[i]])
          continue;
        q[0] = q[3] = NaN;
        c2.setRGB(0.3, 0.3, 0.3);
        if (filterfun) {
          c1.setRGB(void 0, void 0, void 0);
          const df = filterfun(this, i, _namecols);
          if (typeof df !== "object")
            continue;
        } else {
          q[0] = xc[i];
          q[1] = yc[i];
          q[2] = zc[i];
        }
        if (isNaN(q[0])) {
          noxyz++;
        } else {
          if (cbs) {
            cbs[did[i]] = true;
          } else {
            vert[ii] = q[0];
            col[ii++] = c2.r;
            vert[ii] = q[1];
            col[ii++] = c2.g;
            vert[ii] = q[2];
            col[ii++] = c2.b;
            if (!isNaN(q[3])) {
              lines = true;
              const cx = c1.r === void 0 ? c2 : c1;
              vert[ii] = q[3];
              col[ii++] = cx.r;
              vert[ii] = q[4];
              col[ii++] = cx.g;
              vert[ii] = q[5];
              col[ii++] = cx.b;
            }
          }
        }
      }
      const dt = Math.round(performance.now() - st);
      if (cbs)
        return;
      const ll = ii / (lines ? 6 : 3);
      if (noxyz)
        console.log("ddata/filter failed to give xyz for", noxyz, "elements");
      this.usevertcol(ll, lines);
      let ok = true;
      if (filterfun) {
        if (lines)
          E9.filtcount.innerHTML = `filter applied: #lines=${ll} of ${pendl} of ${fulll}, time: ${dt}ms`;
        else
          E9.filtcount.innerHTML = `filter applied: #points=${ll} of ${pendl} of ${fulll}, time: ${dt}ms`;
      } else if (pfilterfun) {
        E9.filtcount.innerHTML = `bad filter not applied`;
        ok = false;
      } else {
        E9.filtcount.innerHTML = `no filter applied: #points=${pendl} of ${fulll}, time: ${dt}ms`;
      }
      (0, import_basic8.log)(E9.filtcount.innerHTML);
      if (ok && !popping && location.href.indexOf("xyz.html") !== -1) {
        let ll2 = location.href.split("&control=")[0];
        if (ll2.indexOf("?") === -1)
          ll2 += "?";
        if (pfilterfun)
          ll2 += "&control=" + pfilterfun.split("\n").join("!!!");
        if (ll2 !== location.href)
          history.pushState({}, void 0, ll2);
      }
      await this.makefilterfun(pfilterfun, E9.filterbox, "confirm");
    }
    usevertcol(ll, lines) {
      const geometry = this.geometry;
      if (ll === 0) {
        console.log("ddata/filter failed to give any xyz");
      }
      const verta = this._verta;
      const cola = this._cola;
      verta.needsUpdate = cola.needsUpdate = true;
      geometry.setDrawRange(0, ll);
      if (lines) {
        this.group.remove(this.particles);
        this.group.add(this.lines);
      } else {
        this.group.remove(this.lines);
        this.group.add(this.particles);
      }
    }
    async makefilterfun(filtin, box, mode2 = "") {
      const tdata = this.tdata;
      let filt = filtin;
      const msg = (m, col) => {
        E9.filterr.innerHTML = `${m} <br><code> ${filt.split("\n").join("<br>")}<code>`;
        if (box)
          box.classList = [col];
        E9.filterr.classList = [col];
      };
      if (mode2 === "force")
        this.lastInputApplied = void 0;
      const applied = mode2 === "confirm";
      if (applied || filtin === this.lastInputApplied) {
        if (applied)
          this.lastCodeApplied = this.lastCodeGenerated;
        this.lastInputApplied = filtin;
        filt = this.lastCodeApplied || "";
        msg("filter applied", "_applied");
        return this.lastFunction;
      }
      this.lastInputTested = filtin;
      msg("testing", "_testing");
      if (!filt) {
        filt = "//";
      }
      let filterfun;
      if (typeof filt === "function")
        filterfun = filt;
      else if (typeof filt === "string") {
        try {
          if (!filt.match(/^Z:/m))
            filt = `Z:${this.getField("Z")}
${filt}`;
          if (!filt.match(/^Y:/m))
            filt = `Y:${this.getField("Y")}
${filt}`;
          if (!filt.match(/^X:/m))
            filt = `X:${this.getField("X")}
${filt}`;
          for (let fn of tdata.header) {
            const sds = 1.5;
            const r = tdata.ranges[fn], l = r.mean, ss = 1 / (sds * r.sd);
            if (filt.match(new RegExp("\\b" + fn + "\\b", "g"))) {
              const usealpha = tdata.ranges[fn].numStrs > tdata.ranges[fn].numNum;
              if (usealpha)
                filt = `const ${fn} = xyz.tdata.valEN('${fn}', i);
${filt}`;
              else if (_XYZ.autorange)
                filt = `const ${fn} = (_namecols['${fn}'][i] - ${l}) * ${ss};
${filt}`;
              else
                filt = `const ${fn} = _namecols['${fn}'][i];
${filt}`;
              tdata.lazyLoadCol(fn);
            }
            if (filt.match(new RegExp("\\b" + fn + "_R\\b", "g"))) {
              filt = `const ${fn}_R = xyz.tdata.val('${fn}', i, 1.5);
${filt}`;
              tdata.lazyLoadCol(fn);
            }
            if (filt.match(new RegExp("\\b" + fn + "_C\\b", "g"))) {
              filt = `const ${fn}_C = xyz.tdata.valC('${fn}', i, 1.5);
${filt}`;
              tdata.lazyLoadCol(fn);
            }
            if (filt.match(new RegExp("\\b" + fn + "_N\\b", "g"))) {
              filt = `const ${fn}_N = (_namecols['${fn}'][i] - ${l}) * ${ss};
${filt}`;
              tdata.lazyLoadCol(fn);
            }
            if (filt.match(new RegExp("\\b" + fn + "_E\\b", "g"))) {
              filt = `const ${fn}_E = xyz.tdata.valE('${fn}', i);
${filt}`;
              await tdata.lazyLoadCol(fn);
            }
            if (filt.match(new RegExp("\\b" + fn + "_EN\\b", "g"))) {
              filt = `const ${fn}_EN = xyz.tdata.valEN('${fn}', i);
${filt}`;
              await tdata.lazyLoadCol(fn);
            }
          }
          filt = filt.replace(/\bVX\((.*?)\)/g, "{const k = $1; _R*=k; _G*=k; _B*=k;}");
          filt = filt.replace(/\bRGB\(/g, "_C.setRGB(");
          filt = filt.replace(/\b_R\b/g, "_C.r");
          filt = filt.replace(/\b_G\b/g, "_C.g");
          filt = filt.replace(/\b_B\b/g, "_C.b");
          filt = filt.replace(/\b_X\b/g, "q[0]");
          filt = filt.replace(/\b_Y\b/g, "q[1]");
          filt = filt.replace(/\b_Z\b/g, "q[2]");
          filt = filt.replace(/\b_L\b/g, "xyz._lasso(q[0],q[1],q[2])");
          filt.replace(/\b_L([0-9])\b/g, "xyz._lasso(q[0],q[1],q[2],$1)");
          filt = filt.split("\n").map((l) => {
            if (l[0] === "?")
              return `if (!(${l.substring(1)})) return;`;
            const [k, _ll] = l.split(":");
            if (_ll === void 0)
              return l;
            const ll = _ll.trim();
            let done = true;
            switch (k) {
              case "COL":
                l = COLS.gencol("_C", tdata, ll);
                break;
              case "COL1":
                l = COLS.gencol("_C1", tdata, ll);
                break;
              case "MD":
                l = "// " + l;
                break;
              case "COLX":
                l = "_C.set(" + ll + ")";
                break;
              case "COLX1":
                l = "_C1.set(" + ll + ")";
                break;
              case "X":
                l = `q[0] = ${ll}`;
                break;
              case "Y":
                l = `q[1] = ${ll}`;
                break;
              case "Z":
                l = `q[2] = ${ll}`;
                break;
              case "X1":
                l = `q[3] = ${ll}`;
                break;
              case "Y1":
                l = `q[4] = ${ll}`;
                break;
              case "Z1":
                l = `q[5] = ${ll}`;
                break;
              case "R":
                l = `_C.r = ${ll}`;
                break;
              case "G":
                l = `_C.g = ${ll}`;
                break;
              case "B":
                l = `_C.b = ${ll}`;
                break;
              case "R1":
                l = `_C1.r = ${ll}`;
                break;
              case "G1":
                l = `_C1.g = ${ll}`;
                break;
              case "B1":
                l = `_C1.b = ${ll}`;
                break;
              default:
                done = false;
            }
            if (done)
              this.setField(k, ll, false);
            return l;
          }).join("\n");
          filt += `
return q;`;
          filt = `"use strict";
            const q = xyz._ret;
            var _C = xyz._col, _C1 = xyz._col1;
            ` + filt;
          if (this.lastCodeGenerated === filt) {
            filterfun = this.lastFunction;
          } else {
            this.lastCodeGenerated = filt;
            this.lastFunction = void 0;
            filterfun = new Function("xyz", "i", "_namecols", filt);
            console.log("filtfun function rebuilt");
            this.lastFunction = filterfun;
          }
        } catch (e2) {
          msg("invalid function: " + e2.message, "_invalid");
          return badfun;
        }
      } else {
        msg("unexpected filter type", "_unexpected");
        return badfun;
      }
      try {
        const r = filterfun(this, 0, tdata.fvals);
      } catch (e2) {
        msg("function throws exception: " + e2.message, "_exception");
        return badfun;
      }
      msg("OK: ctrl-enter to apply filter", "_OK");
      return filterfun;
    }
    setPointSize(eventsize, temp = "") {
      let size = eventsize.srcElement ? +eventsize.srcElement.id.substring(4) : +eventsize;
      if (temp === "out")
        size = this.permspotsize || this.guiset.spotsize;
      if (temp === "in" && size * size * this.tdata.n > 4e5)
        return;
      this.permspotsize = temp === "in" ? this.guiset.spotsize : size;
      this.guiset.spotsize = size;
      if (usePhotoShader) {
        const k = 1e3;
        const sizeUniform = this.material.uniforms.size;
        const r = sizeUniform.value / k;
        if (size !== void 0)
          sizeUniform.value = size * k;
        return r;
      }
      if (size !== void 0 && this.material)
        this.material.size = size;
      this.guiset.spotsize = size;
      const radio = E9["spot" + this.guiset.spotsize];
      if (radio)
        radio.checked = true;
      return this.material && this.material.size;
    }
    async filtergui(evt = {}) {
      const box = E9.filterbox;
      const filterr = E9.filterr;
      const boxv = box.value.trim();
      try {
        const fun = await this.makefilterfun(boxv, box);
        if (fun === badfun)
          return;
        if (evt.keyCode === 13 && evt.ctrlKey) {
          this.dataToMarkersGui();
        }
      } catch (e2) {
        box.style.background = "#ffffd0";
        filterr.innerHTML = e2.message;
      }
    }
    setupGraphics(fid = this.fid) {
      let l = this.tdata.n;
      if (!this.material) {
        let sprite;
        if (location.href.startsWith("file:") || location.host.startsWith("combinatronics.com") || location.host.startsWith("mlv.") || location.href.indexOf("CIV") !== -1 || navigator.userAgent.indexOf("Edge") > -1) {
          var image = new Image();
          image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wgaExY5fZXYlgAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAASFUlEQVR42u1bS48bR5KOR2ZV8dHsh97WeD2Y82IxEI996YMAw/9jftb8j8ECPVgBgz74QP+AgS0YMNAtW61+kyxWZkbsIbPIYrHYLcmaxQK7BFJksyiy4osvIiPjAfD/j//bD/ySX/aXv/wFW9+LD6zmQxvP9y3461//qv+rAGgJXi96YDVBaAoo96z6OnwpMPALCl4Lxem1Sa9N6zWn1WZBLWQAAN94br6ur0sTtN8DAn4hjVNDMNtYWWvZw/HYQrHDvZ5h8IBgADx4BQ/inPNlWfrJZOIAwAFA1XiuXzdBCb8XCPwdwjfpbJLAeVoFABRjgN7O0VGR93qFZVswY27IZMhoAMEg4NIEFDSogBcJVQihEucWpXPl5eW8nExO5gBQprVIqwYptEzkk8wCP0N4bFDdNDTdS2tweHg4GI6GwyIrBsbagWHuE1GPiQogyhAxIwRGQEp3KqoaVNWpqhORUkTKEPxcJEzdwk1nZTm9PD6eTgCmADADgHkComowogbio0HAzxCeGlSvBe8DwPDo8Gg03B+OcpuPTGZGhs0OMw+JaYCEPSIuECAnjAyAyAAEAFHQAAJeQSsRXajKXCTMQpBp8OHOeXfjnLspp+XNf16e38JkcgsrMGog1sziY0DAzxDeJMHzJPjOeHw4evFitJ/n/b3M2n02Zt8Ys8tEO0g8JMI+EfUQMUdECwAGERkBUREAVFUVBEB9YkGlqqWqzIPoVEK4CyFce++vnXNXVbW4nE5nV8fHx1cAcAsAd4kRVcMsPgoE/AThuSF8DwAGALD7+vXr/cFg56Ao8kfWmsfGmANm3mPmXSIaEtEAEQsiyhHRYtQ8AwAhIAFG+WsPr6BeRb2qViJSqupcRO5CCLchhOsQwqV37sPCVR8W5eLD2dnlxWRycg0ANw021M7yQRDwE4XPk/A7Y4C9p99992gw6D/JsvyJtfaJYfOIDR8w8S4S7TBTn4gKQMgIySKiAQBGREKA5AMVQUE17fGquuYPVHQhKvMQwp2I3obgr0IIH7xz55Vz78v5/P31zc35mzdvLgDgOplF+bEg4EfSvrb3PgCMxoeHBy/29x/3er1neZ4/s9Y+ZeYnxpgDIt5jpiFRFB4RLSFZQGBCJEAkROyMBGsmJBBEVbyIOlWpRHQuItPEhMsEwm8L535dlOWvt7e3vx0fH38AgKtkEmXDL2x1jOYTbD4KPz48ePno0dNer/c8y7IX1trnxpinzHxgmPeIeUhEfUTMicgSESMiQ9I6IiIg1tI3I0GI8kcg4oOESIOIOEIpAlKPkHoUTaqIPoUyQjRARK9fv8bj4+PO8LkRQa49+IF9vmnzo/F4fPDi5bNn/V7/RZ7nL7M8e2mNfWGMeWqtfcTMu8w8ZOYeM+dEZJnIIDEzERERxn8RiRDT30jxD4zvE+HqQYjIiMhIZBAxLiIb/QmadA0JAMgY/cPLl+Ht27fS2BGWUeOrV6/ghx9+uB+AV69e1dqv9/geAAwBYH88/vPTQX/4VZ5lL22WvTTWvjDWPEmOb5eZ+8xcMHPGRIZqsVfCR6kiBIgtSZeyE0L9SYisIYhvcVq1L0nPQIQICCiGSJ49f+5//vln3xUktUEwD+z1S+1/9+13B0Vv8DTLsufGZi+MNc+N4SfMZp+Jdpi5IKKMiAwhEq6EjSJESQBT8IeIbQ8Q1RStAFUVVBUQEVQVURAFdYkXABAgkAGDAKCgIKoQVNWPRrtuPB67yWTSBYJuZUDSftvud4+Ojh7t7u0+L4reyyzLXlobac+GDzgGOz0iyonIEBEnzSMz1xQHIoKoWQJEjH8nQBARID0T4dr7tcSw2jZWrABIThUoBVUKAAGRQp7n7p///Gc7XN4wBfOA9vswhtFoNDrIsuxJZuxTY8wTZn7EzHtMPGSiHhFlzGSImFYU7xByyYLuDSg5Qai131yogAKa3OjSiRbxP7AwQ9o6oVKVMoRi/vr16/nx8XHZCpCkyQLu0D43orzdb//j28eDweB5ludfWWu/MsY8N8Y8MswjMqbPRDkxGSamhlMDYoZa80sGNEDZDs72BUtjAlSorQobJ1NV1Xh0VoAKARbD4XBxdnbm2hFizQJzT5zfG48Ph0XR38sy+8gwPzKGD5YRHlOPo80zEy9dd1PYpqDwgA9oaj/Z/cYCABARRCRlBlrtnlqoamA2uyK6EOFZZsytz7Lbx48f36XgaN7FAm5pnxqOb/fPf/73R4NB8SzLiq+Wds+8b4zZYeaCiQ0l1a/ZehK8DUQ3C6Ly7mcDtEHDVjC3llhRjYcqUChFZT4cDsuzs7NFOzB69erV2i6wHvKOx/0sy0bGZHuN2H6HiPqEmCGSQcJa+C0CIiBSS5Dk8Bo/W8vV1v7qQUCkICJASFFNAKgKgKhERKyqVlULIhow00gC77E1e5m1u/v7jy+TUmcJBKpBMB2ZHQsAxdHOft/abIeZR8Q0IsKdFN7mSGRTTIMNT32vjW9oOKp0zQRq4WttqyqoyDKEi2GBAMpyx0AAAlUlJDIoYik65QExjTjQyNpsVBT5MDnMrJGyQwBQ6mCABYB8OLR9a3jIzDuMNCTiKDwuw1taBTG0XWAiwC6/0Pr8NtOJn0vX1r537TXGwJJMikV6kQm8w8zDPLeDw8PDXgLANJOyppXUZACwYxgXbLM+MQ+IeBifqUDEDAlNI2Jd3kxkdn1TDWE3tB8p394K2wxoPogARNZ9AylFv4+KhASKWkeKFhFzXDFhQMYMhr1hFwDQCcDOUZFbMj0m7hNBDxGLOplB7RgWCRAQENZt/YHtbGMX2BAe148vbeeoqC3Q184OlgmLQBiZQNSzhS0eYsDSCeb5MGND6cRFBRHlAGAofjnhalNeJrUeEroLBIDoDBXWBUdFEJUGQWp2bP0NREStASAkI0CW4r0XTNRj5rwFAAFAoDVXmwAgshmhyZAwxzqTQ2Tqszw24o9t2l2uewIcomg+a/4BI7UR2maDnVtm4zexETYbJLSImCVzyIkoPzw8tO26RNcuYKwlg4QZImaYChuUMjm12poCNm15g+ZbGYCAHekY1foHNn1D/L+aPrNpHomKlO7TAIBFxIwIM2a21lrTLsp0AUDLc/dqUTOhsSlgGxDotPVuM4COEiG2hIfNLbL7jFH7V0IAQopHZ4QohzGGG/TfOA6vQKAlEOu1vPVIrFuClsBdr9ffw/YJdSMWQIQ1++/aKTa+GDEmXQEYARmAGHizLkkdOUKkmI5YfrCp2I8rNmCHoCt81vxABxu2s+P+3C52X0BI4QQDtz+CbQBgvFneBv3kipvec6V1CAJ9WKMPyp8OUvfjpiGEzRij/aEJgIKIKKgoaDuLop8kvq5Tepn56TjldZnAx77fcXdr5XZVFQFRAN6Qx7S+RgFAgkJQhQCylliUeAOrxNWmOldprFq72HBoS3pra+9vJUGa39UWfO11t/QxoQyxvgAAAWpZ/ELa2WLTFh4AAogGUPUaS1UhrQRC4x6hpc2Gs9g43KStTes9TB/IBHVca4MVQVptn3UyHQAk5gjVq6gTEKcqzrtlEbUTgGVzggvOiUiVanRVA4jlb9xH35Xnbnhz0JVJJGao6hoW25IgbYDuMQ1NDBAAiHVG0EpFq6BS3cKtb+cH2yYQAXCu0hAWolKq6iIB4VU1RKWrqip23XQtWLysAF3b1mqrXzOELgC2AbK+msUUFVX1oupAdSGipaiWwYVqcjJxjU6TrQxw8/l84Xd3SwkyT7X6BZA6VQ21Y0w/CqqrFHY0g6jplZ0IaNPXag3KWshwb0I00Xs7KCpNBEKkviwkVZglhLlzruwqoVPLBwQAcCcnJwvn3SxImInKTEXnEpngRCRIrNt9lMZUFFQlJjZElk5ENf2dlqounzfXA7+1qqcFEVlWlkVkJiIzH/ysAcDDDACA0lVuLiFMNeidsEw1FicrIvIqYhRRN7S/RlNZ7rIiKQBqOchtSdEmE7aDsgRHRURFREQlqKoT1VJEZyoy9SHcBR+ml5eX8w4ANnyAJAAW8/l82u8Pbq31Nyx8GyRMSWmuqoWIWiLlmKHFNTMQESCiKDTpZqBxT+ID4GG6twBJm0GqJktsr1GRmUi48yI3IYRb59x0Mpl0AQDUtQsAQPnmzZuZc9Vt8P4mhHAjIrciMpMQSlVxIhJUVURENWpgReUl/ddp3qR6UxCR+r1ujUstuOja/0+rfvi0c6VeArkOwV97567v7spmB0noMoEmCD59cDabzW6zLL8yNlyGEPaIaESEPRTJsU6OQKzZUeNmSQQk5fe6tF+f99ssuN8RRv8hDe3X1FdVLyKViMyDyF0QuQ4hXHnnr6qqunnz5rjdL7BsmqBW40ATgPnx8eWtc9W18/4yhHApQa5CSEyIP+iT9YnULAhhQ9Mbjk42r20sbX9HZEpilUa5VUQkiIgTkbmI3IlPbTTeXzjnLmazWbNrpBkIQRcDtOEI5wCTu+l0/8pau2OId4hpgAF7iJTXeYKUHDDL4yURisg9pS5IMQLcG+93275AtLil4wsi4kIIZeoeuQ4SLoL3586587KqLo+Pj28a9QD/UG2wfZSkt2/f8jd/+hNbYywjWYhpJlPX5ht5g41cyLaTizbjBNi2dW46vqTzWngfQqh7Cu9S28x77927qnKnZVW++3B1/f6Xn3++TJ1kdfOUNHuGlgD88MMP8OrVq66yEz178oSyImMiNtzo1IDY6kbrIGjz+NxVAq737Xv29VYMIJqOdBJ3PZUQQqhiM2W4CyFchRDOvfe/OudOF4vF2d3t3a//9fe/f2h0jzXtf1ke7+oP2Ego/PLLL/D1H75Gaw2vta0kwXE9y1KHyG0gNw45m5pv2X0Uetk1ldxNSP6nDCFMQwhX3vtz7/2v3rvTxcKdzmazd3/729/OU8PUNGnft7W/AUCDBRun7bdv3+Ifv/63uuxdt33QlhmAhsC6pPna+9qgfyNCTHRPB1pRXWpeQtrqFrXD8yFchiR81Hx1Wpbzs9OL0/dnv5zV1C+bpfF2p9hGj9AWEAAA9MeffoJvvvlGOXV7NAweoTPDq0s5oXmA2MqA5fYGDUdXb3MuCT8TkdsQ/GWT9tVicTqfz9+dn5+///7k+4sk/Hwb9bcC0DKF9hSH/Pjjj5pAECRaDTEoaqzXLlMZUh/a66AN1k9tqwsrhq+IvtJ4ley97hi99iFc+ODfe+/fOefOqqo6nc9nZ+fXH347+cdJl93LtmbJTgDuMYUahPD1118HIoonK8SAAEEV/CoLo6KgITnvsGp+jMK2/pZ0kAki6lOkWYnIIm1xdyGEW+9Tl6j3773z76qqOquq8nQ+L88+fPjw/uQfJxct4f026t8LQAcI7ZGW8NNPP4WXL196IvCq6ADUQUxAxCXqFMCpqgMAL7LMMHmNmg0i6uISJyIuneIWjZPcNIRwE728XIQQzr1zv4bgzypXnS0W5dl8Xr47PT09//777y86+oVlG/U/p1m6ORhRpGbpncPDw939/f2DoigOsix7ZIzZZ+Z9Zt5l4h2i1CofS1Sx0oRoGp1dAOt9wjGTszzP60yC3AXxNyHItfPuwrtwUVbzD9Pb6UXqGL/u6Bj/qNmBz2mX58Z0SN01Pnr97etRvxjs5Vm2Z43dY2t2mXnERENC7CNRj5ByJMgA0CAgA9aHsUZzU90uL1pKnBm4C0HuvA/Xwftr593VbDG7ujn77epkMrlJgk9bwxMfPTjxOQMT7db5BhDjnW+/fbxT5MWOzezIGDNk5iETD4gpltkJcwSyiMtOjWU6btkhrroIIQ5MSJBp8O6u8v7WufLm8u7m9uTNST0jMGuM0bTniOCLDUzcMy/UHJIq0uoDQP/o9dFgWAz7bO3AMPUMmx4SFYSUEYFFRKOAGCvfdYs8+NQZvvAhlEFkHhZutnCL2fn53XQyOZk1xmXK1mzAZ80N/Z6hKdwCRNYcnIIxFEc7R3me57m1NqfU6EwUu8viEVQEBEQk+BDABecqF9zicj5fTE5OmsNSZWuCbKMh+lMnxz57brBlEtiouzeHqWpAmqN0BgDMeDymoiioLMtYkZqAAEzqhIy7Z7X7fz9rWuxfMTiJHazgjoFJbk2PbhZmNld7aHKtxPU/Pjj5kUBsG6HFlvDQAYJC98jsF58h/lcNT0PH4ei+wek2CLBl6uOLD0//NxKXqwa3BaHgAAAAAElFTkSuQmCC";
          sprite = new THREE.Texture();
          sprite.image = image;
          image.onload = function() {
            sprite.needsUpdate = true;
          };
        } else {
          var textureLoader = new THREE.TextureLoader();
          sprite = textureLoader.load("sprites/circle.png", (spr) => {
            this.material.map = spr;
            this.material.needsUpdate = true;
          });
        }
        X12.currentThreeObj = this.group = new THREE.Group();
        this.group.name = fid + "group";
        this.group.xyz = this;
        const size = 0.3;
        this.material = new THREE.PointsMaterial({
          size,
          map: sprite,
          depthTest: true,
          transparent: true,
          alphaTest: 0.3,
          vertexColors: true
        });
        this.defaultMaterial = this.material;
        this.lassoMaterial = void 0;
        this.XMaterial = void 0;
        this.linematerial = new THREE.LineBasicMaterial({depthTest: true, transparent: true, alphaTest: 0.3, vertexColors: true});
        this.geometry = new THREE.BufferGeometry();
        this.particles = new THREE.Points(this.geometry, this.material);
        this.particles.frustumCulled = false;
        this.particles.xyz = this;
        this.lines = new THREE.LineSegments(this.geometry, this.linematerial);
        this.lines.frustumCulled = false;
        this.lines.xyz = this;
        this.gb.addToMain(this.group, fid, void 0, this);
      }
      if (!this._verta || this._verta.count != l * 3) {
        let vert = this._svert = new Float32Array(l * 3);
        let col = this._scol = new Float32Array(l * 3);
        const verta = this._verta = new THREE.BufferAttribute(vert, 3);
        const cola = this._cola = new THREE.BufferAttribute(col, 3);
        verta.needsUpdate = cola.needsUpdate = true;
        this.geometry.setAttribute("position", verta);
        this.geometry.setAttribute("color", cola);
      }
    }
    _lasso(x, y, z, id) {
      return this.gb.lasso.lassoGet(x, y, z, id);
    }
    async getCallbacks() {
      const cbs = {};
      const f = `
X:${this.getField("X")}
Y:${this.getField("Y")}
Z:${this.getField("Z")}
if (!xyz._lasso(q[0], q[1], q[2])) return;
`;
      await this.dataToMarkers(f, void 0, cbs);
      console.log("filtered OK ", Object.keys(cbs).length);
      return cbs;
    }
    setField(fieldRole, fieldName, update = true) {
      const ofilt = "\n" + E9.filterbox.value + "\n";
      if (fieldRole === "MD") {
        if (fieldRole === "MD" && ofilt.indexOf("\nMD:" + fieldName + "\n") !== -1)
          return;
        E9.filterbox.xvalue = ofilt + "MD:" + fieldName;
      } else {
        fieldName = fieldName.trim();
        if (this.fields[fieldRole] === fieldName)
          return;
        this.fields[fieldRole] = fieldName;
        const rx = new RegExp("^(.*)\\n" + fieldRole + ":(.*?)\\n(.*)", "s");
        let g = ofilt.match(rx);
        if (g)
          E9.filterbox.xvalue = `${g[1]}
${fieldRole}:${fieldName}
${g[3]}`.trim();
        else
          E9.filterbox.xvalue = `${ofilt.trim()}
${fieldRole}:${fieldName}`.trim();
      }
      if (update)
        this.dataToMarkersGui();
    }
    commentField(fieldRole, fieldName, update = true) {
      const ofilt = "\n" + E9.filterbox.value + "\n";
      const r = "\n" + fieldRole + ":" + fieldName + "\n";
      const cr = "\n//" + fieldRole + ":" + fieldName + "\n";
      const nfilt = ofilt.replace(r, cr);
      if (ofilt === nfilt)
        console.error("cannot comment missing field", r);
      else {
        E9.filterbox.xvalue = nfilt;
        if (update)
          this.dataToMarkersGui();
      }
    }
    getField(fieldRole) {
      const f = this.fields[fieldRole];
      if (f)
        return f.trim();
      const filt = new RegExp(`${fieldRole}:(.*)`);
      const m = E9.filterbox.value.match(filt);
      if (m)
        return m[1].trim();
      const v = this.def[fieldRole];
      E9.filterbox.xvalue = `${E9.filterbox.value}
${fieldRole}:${v}`;
      return v;
    }
    setColor(fieldName, details) {
      this.setField("COL", fieldName);
    }
    setBackground(r = 0, g = r, b = r, alpha = 1) {
      this.gb.setBackground(r, g, b, alpha);
    }
    setHostDOM(host) {
      host.appendChild(this.gb.renderer.domElement);
      const gb = this.gb;
      const renderer = gb.renderer;
      host.addEventListener("resize", gb.onWindowResize);
      gb.onWindowResize();
      renderer.domElement.style.zIndex = 999;
      renderer.domElement.style.position = "relative";
      renderer.domElement.ondblclick = () => E9.xyzviewergui.style.display = E9.xyzviewergui.style.display ? "" : "none";
    }
    getHostDOM() {
      return this.gb.renderer.domElement.parentElement;
    }
    setSize(x, y) {
      this.gb.setSize(x, y);
    }
    headerSetup() {
      if (this.def)
        return;
      const tdata = this.tdata;
      this.def = {};
      this.def.X = tdata.header.includes("x") ? "x" : tdata.header[0];
      this.def.Y = tdata.header.includes("y") ? "y" : tdata.header[1];
      this.def.Z = tdata.header.includes("z") ? "z" : tdata.header[2];
      this.def.COL = tdata.header.includes("col") ? "col" : "fixed";
      this.setField("X", this.getField("X"), false);
      this.setField("Y", this.getField("Y"), false);
      this.setField("Z", this.getField("Z"), false);
      const s = [`<option value="fixed">fixed</option>`];
      s.push(`<option value="random">random</option>`);
      for (const name of tdata.header) {
        const r = tdata.ranges[name];
        if (r.range === 0)
          console.error("do not add column to dropdown, range 0", name);
        else {
          let nname = name;
          if (r.numStrs > r.numNum)
            nname = name + " C" + tdata.vsetlen[name];
          else if (r.numNum === tdata.n)
            nname = name + " N*";
          else
            nname = name + " N" + r.numNum;
          s.push(`<option value="${name}">${nname}</option>`);
        }
      }
      E9.colourby.innerHTML = s.join("");
    }
    useJson(j) {
      return this.tdata.useJson(j);
    }
  };
  var XYZ = _XYZ;
  __publicField(XYZ, "baseguiset", {spotsize: 0.2, colourby: "fixed", colourpick: "#ffffff", filterbox: ""});
  __publicField(XYZ, "autorange", true);
  __publicField(XYZ, "constructorDone");
  function filterAdd(s, end = false) {
    const l = E9.filterbox.value.split("\n");
    if (l.includes(s))
      return;
    if (end)
      l.push(s);
    else
      l.unshift(s);
    E9.filterbox.xvalue = l.join("\n");
    dataToMarkersGui();
  }
  function filterRemove(s) {
    let l = E9.filterbox.value.split("\n");
    l = l.filter((ll) => ll !== s);
    E9.filterbox.xvalue = l.join("\n");
    dataToMarkersGui();
  }
  function applyurl() {
    const con = decodeURI(location.href).split("&control=")[1] || "";
    return con.split("!!!").join("\n");
  }
  function col3(r, g = r, b = g) {
    return new THREE.Color().setRGB(r, g, b);
  }
})();
