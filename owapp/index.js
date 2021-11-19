import Eventable from './eventable.js';
import MapManager from './map.js';
import XHRPromise from './xhrpromise.js';
import { Dialog } from 'jsfreemaplib';
import * as OpenWanderer from 'openwanderer-jsapi';
import * as OWTransition from 'openwanderer-jsapi-transitions';

class App extends Eventable {
    constructor(options) {
        super();
        if(!options) {
            throw "Options not provided, please specify all required options.";
        }
        options.css = options.css || { };
        this.dialogStyle = options.dialogStyle || {
            backgroundColor: 'rgba(128,64,0)',
            color: 'white'
        };
        this.controls = options.controlIcons;
        this.loginContainer = options.loginContainer;
        const css = {
             signup: options.css.signup || `left: 25%; top: 10%; width: 600px; height: 400px; `, 
             login: options.css.login || `left: 37%; top: 25%; width: 25%; height: 288px; `,
             mapPreview: options.css.mapPreview || 'left: calc(100% - 200px); bottom: 0px; width:200px; height: 200px; display: block; position: absolute'
        };
        this.createSequence = options.createSequence === false ? false : true;
        this.api = options.api || {};
        this.api.login = this.api.login || 'user/login';
        this.api.signup = this.api.signup || 'user/signup';
        this.api.logout = this.api.logout || 'user/logout';
        this.api.rotate = this.api.rotate || 'panorama/{id}/rotate';
        this.api.nearest = this.api.nearest || 'nearest/{lon}/{lat}';
        this.api.sequence = this.api.sequence || 'sequence/{id}';
        this.api.sequenceCreate = this.api.sequenceCreate || 'sequence/create';
        this.nomproxy = options.nomproxy || 'nomproxy'; 
        this.setupUpload = options.setupUpload || (options.setupUpload === false ? false : this.defaultSetupUpload);
        this.setupCss(css);
        this.setupNavigator(options.navigator);
        this.setupControls(options.controlContainer, options.controlIcons);
        this.searchContainer = options.searchContainer;
        this.rotateControlsContainer = options.rotateControlsContainer;
        this.uploadContainer = options.uploadContainer;
        this.dialogParent = options.dialogParent || document.body;
        this.setupSearchControl();
        this.setupRotateControls();
        if(this.setupUpload) {
            this.setupUploadForm();
        }
        this.panoEl = this.navigator.viewer.psv.parent;
        this.mapEl = document.createElement("div");
        this.mapEl.id = "ow_map";
        this.panoEl.parentElement.appendChild(this.mapEl);
        this.setupMediaQueries();
        if(this.setupUpload) {
            this.setupUpload();
        }
        this.setupMap(options.zoom || 16, options.cameraIcon);
        this.setupModes();
        this.navigator.on('locationChanged',(lon,lat)=> {
            this.lon = lon;
            this.lat = lat;
            if(this.mapMgr) {
                this.mapMgr.setView([lat,lon]/*, zoom*/);
                const zoom = this.mapMgr.map.getZoom();
                window.history.pushState  ({lat:lat, lon:lon, zoom:zoom},"OpenTrailView", `${window.location.href.replace('#','').split("?")[0]}?lat=${lat}&lon=${lon}&zoom=${zoom}`);
            }
        });
        this.setupSignup();
        this.setupLogin();
        this.setupSearch();
        this.setupRotation();
        this.lat = -181;
        this.lon = -91;
    }

    on(eventName, cb) {
        if(eventName == 'deletePano') {
            this.mapMgr.on(eventName, cb); 
        } else {
            super.on(eventName, cb);
        }
    }

    setupCss(customisableCss) {
        const style = document.createElement("style");
        style.type = 'text/css';
        style.innerHTML = '#ow_map {z-index: 999; overflow: hidden; position: absolute; width: 100%; height: 100%; left: 0%;}';
        style.innerHTML += `#ow_map.preview {${customisableCss.mapPreview} }\n`;
        style.innerHTML += '#ow_map a { color: blue }\n';
        style.innerHTML += `#ow_dlgSignup {${customisableCss.signup}; position: absolute }`; 
        style.innerHTML += `#ow_dlgLogin {${customisableCss.login}; position: absolute }`;
        style.innerHTML += '#ow_search { padding: 5px; margin-bottom: 0px; }';
        style.innerHTML += '#ow_searchResults { background-color: white; color: black; margin-top: 0px; }';
        style.innerHTML += '#ow_searchResults a { color: blue; margin-bottom: 5px; }';
        style.innerHTML += '#ow_imageContainer { float: right; }';
        style.innerHTML += '#ow_searchBtn { right: 0px; }';

        document.querySelector("head").appendChild(style);
    }

    setupNavigator(nav) {
        if(nav) {
            this.navigator = nav;
        } else {
            this.navigator = new OpenWanderer.Navigator({
                api: { 
                    byId: 'panorama/{id}', 
                    panoImg: 'panorama/{id}.jpg',
                    nearest: this.api.nearest || 'nearest/{lon}/{lat}',
                    sequenceUrl: this.api.sequence || 'sequence/{id}'
                },
                splitPath: true,
                svgEffects: true,
                panoTransFunc: OWTransition.Transition.goTo.bind(OWTransition.Transition)
            });

            OWTransition.Transition.init(this.navigator);
        }
    }

    setupControls(controlContainer, data) {
        let html = "";

        const controls = {'select': 'Select panorama', 
                          'rotate': 'Rotate panoramas',    
                          'drag': 'Move panoramas',
                         'delete' : 'Delete panorama', 
                        'switchMode' : 'Map'};

        for(const id in controls) {
            if(data[id]) {
                html += `<img id='ow_${id}' src='${typeof data[id] == 'object' ? data[id][1]: data[id]}' alt='${controls[id]}' title='${controls[id]}' />`;
            }
        }
        document.getElementById(controlContainer).innerHTML = html;
    }

    setupSearchControl() {
        document.getElementById(this.searchContainer).innerHTML = `<div id='ow_search'> <input id='ow_q' type='text'  /> <div id='ow_imageContainer'> <img src='${this.controls.search}' alt='Search' id='ow_searchBtn' /> </div> </div> <div id='ow_searchResults' style='clear: both'></div>`;
    }

    setupRotateControls() {
        document.getElementById(this.rotateControlsContainer).innerHTML = "<strong>Adjust panorama</strong> Pan: <input id='ow_anticw' type='button' value='&larr;' /> <input id='ow_cw' type='button' value='&rarr;' /> Tilt: <input id='ow_tiltminus' type='button' value='-' /> <input id='ow_tiltplus' type='button' value='+' /> Roll: <input id='ow_rollminus' type='button' value='-' /> <input id='ow_rollplus' type='button' value='+' /> <input id='ow_save' type='button' value='Save to server' /> <br />";
    }


    setupUploadForm() {
        if(this.uploadContainer) {
            document.getElementById(this.uploadContainer).innerHTML = "<form method='post' enctype='multipart/form-data'> <fieldset style='width: 800px; border: 1px solid black; padding: 0px'> <legend>Upload panoramas:</legend> Select your file(s): <input type='file' id='ow_panoFiles' multiple /><br /> <progress id='ow_progress' value='0' max='100' style='width: 90%'></progress><br /> <span id='ow_uploadProgress'></span><br /> <input type='button' id='ow_uploadBtn' value='Upload!'> </fieldset> </form> <p id='ow_uploadStatus'></p>";
        }
    }

    setupModes () {
        document.getElementById("ow_switchMode").addEventListener("click", this.switchMode.bind(this));
        this.setupMode(0);
    }

    switchMode() {
        this.setupMode(this.mode==0 ? 1:0);
    }

    setupMode(newMode, loadCentrePano=true) {
        const images = this.controls.switchMode, alts = ['Panorama', 'Map'];
        document.getElementById('ow_switchMode').src = images[newMode==0 ? 1:0];
        document.getElementById('ow_switchMode').alt = alts[newMode==0 ? 1:0];
        document.getElementById('ow_switchMode').title = alts[newMode==0 ? 1:0];
        

        switch(newMode) {
            case 0:
                this.panoEl.style.display = 'block';
                document.getElementById('ow_drag').style.display = 'none';
                document.getElementById('ow_rotate').style.display = 'none';
                document.getElementById('ow_delete').style.display = 'none';
                document.getElementById('ow_select').style.display = 'none';
                document.getElementById(this.searchContainer).style.display = 'none';
                this.setupMapPreview();
                
                if(this.mode==1 && loadCentrePano === true) {
                    var mapCentre = this.mapMgr.map.getCenter();
                    fetch(`/nearest/${mapCentre.lng}/${mapCentre.lat}`).then(response => response.json()).then (data=> {
                        if(data.id != this.navigator.curPanoId) {
                            this.navigator.loadPanorama(data.id);
                        }
                    });
                }
                
                if(this.userid) {
                    if(this.uploadContainer) {
                        document.getElementById(this.uploadContainer).style.display = "block";
                    }
                    document.getElementById(this.rotateControlsContainer).style.display = "block";
                }
                break;

            case 1:
                
                this.panoEl.style.display = 'none';
                this.mapEl.classList.remove('preview');
                this.mapMgr.map.invalidateSize();
                document.getElementById('ow_select').style.display = 'inline';
                document.getElementById(this.searchContainer).style.display = 'block';
                if(this.userid) {
                    document.getElementById('ow_drag').style.display = 'inline';
                    document.getElementById('ow_rotate').style.display = 'inline';
                    document.getElementById('ow_delete').style.display = 'inline';
                }
                if(this.uploadContainer) {
                    document.getElementById(this.uploadContainer).style.display = "none";
                }
                document.getElementById(this.rotateControlsContainer).style.display = "none";
                this.mapMgr.setView([this.lat, this.lon]);
                break;

        }
        this.mode = newMode;
    }

    setupMap(zoom, cameraIcon) {

        if(!this.mapMgr) {
            this.mapMgr = new MapManager({userProvider: this,
                                onPanoMarkerClick:id=> { 
                                    this.setupMode(0, false);
                                    this.navigator.loadPanorama(id);
                                },
                                onPanoChange: this.navigator.update.bind(this.navigator),
                                onMapChange: (centre,zoom)=> {
                                        localStorage.setItem('lat', centre.lat);
                                        localStorage.setItem('lon', centre.lng);
                                        localStorage.setItem('zoom', zoom);
                                    
                                },
                                zoom: zoom,
                                cameraIcon: cameraIcon,
                                api: {
                                    move: this.api.move,
                                    rotate: this.api.rotate,
                                    del: this.api.del,
                                    panos: this.api.panos
                                }
                            });
            document.getElementById("ow_select").addEventListener("click", 
                this.selectPanoChangeMode.bind(this, 0));
            document.getElementById("ow_rotate").addEventListener("click", 
                this.selectPanoChangeMode.bind(this, 1));
            document.getElementById("ow_drag").addEventListener("click", 
                this.selectPanoChangeMode.bind(this, 2));
            document.getElementById("ow_delete").addEventListener("click", 
                this.selectPanoChangeMode.bind(this, 3));
            this.selectPanoChangeMode(0);
        }
    }

    selectPanoChangeMode(mode) {
        this.mapMgr.panoChangeMode = mode;
        switch(mode) {
            case 0:
                document.getElementById('ow_select').classList.add('selected');
                document.getElementById('ow_rotate').classList.remove('selected');
                document.getElementById('ow_drag').classList.remove('selected');
                document.getElementById('ow_delete').classList.remove('selected');
                break;
            case 1:
                document.getElementById('ow_rotate').classList.add('selected');
                document.getElementById('ow_drag').classList.remove('selected');
                document.getElementById('ow_select').classList.remove('selected');
                document.getElementById('ow_delete').classList.remove('selected');
                break;
            case 2:
                document.getElementById('ow_drag').classList.add('selected');
                document.getElementById('ow_rotate').classList.remove('selected');
                document.getElementById('ow_select').classList.remove('selected');
                document.getElementById('ow_delete').classList.remove('selected');
                break;
            case 3:
                document.getElementById('ow_delete').classList.add('selected');
                document.getElementById('ow_rotate').classList.remove('selected');
                document.getElementById('ow_select').classList.remove('selected');
                document.getElementById('ow_drag').classList.remove('selected');
                break;
        }
    }
            

    defaultSetupUpload () {
        document.getElementById('ow_uploadBtn').addEventListener("click", async(e) => {
            const panofiles = document.getElementById("ow_panoFiles").files;
            if(panofiles.length == 0) {
                alert('No files selected!');
            } else {
                const panoids = [];
                for(let i=0; i<panofiles.length; i++) {
                    const formData = new FormData();
                    formData.append("file", panofiles[i]);
                    const request = new XHRPromise({
                        url: 'panorama/upload',
                        progress: e => {
                            const pct = Math.round(e.loaded / e.total * 100);
                            this.showProgress(pct, e.loaded, e.total);
                        }    
                    });
                try {
                    const result = await request.post(formData);
                    this.showProgress(0);
                    const json = JSON.parse(result.responseText);
                    if(json.error) {
                        alert(`Upload error: ${json.error}`);
                    } else if (json.warning) {
                        alert(`Upload warning: ${json.warning.length === undefined ? json.warning : json.warning.join(',')}`);
                    } else if (result.status != 200) {
                        alert(`HTTP error: status ${result.status}`);
                    } else if (json.id) {
                        panoids.push(json.id);
                    } else {
                        alert('Missing ID in panorama - this should not happen');
                    }
                } catch (e) {
                    alert(`Network error: ${e}`);
                }
            }
            if(this.createSequence && panoids.length > 0) {
                try { 
                    const response = await fetch(this.api.sequenceCreate || 'sequence/create', {
                        method: 'POST',
                        body: JSON.stringify(panoids),
                        headers: {
                            'Content-Type' : 'application/json'
                        }
                    });
                    const seqid = await response.text();
                    alert(`Sequence uploaded with ID ${seqid}`);
                } catch(e) {
                    alert(`Could not create sequence: error=${e}`);
                }
            }
        }
      });
    }
        
    setupSearch() {
        document.getElementById('ow_search').addEventListener('click', e=> {
            e.stopPropagation();
        });
        document.getElementById('ow_searchResults').addEventListener('click', e=> {
            e.stopPropagation();
        });

        document.getElementById('ow_search').addEventListener('keyup', e=> {
            if(e.key == 'Enter') {
                var q = document.getElementById('ow_q').value;
                this.nominatimSearch(q);
            }
        });

        document.getElementById('ow_searchBtn').addEventListener('click', e=> {
            var q = document.getElementById('ow_q').value;
            this.nominatimSearch(q);
        });
    }

    nominatimSearch(q) {
        fetch(`${this.nomproxy}?q=${q}`)
                .then(response=>response.json())
                .then(json=> {
                    var nodes = json.filter(o => o.lat != undefined && o.lon != undefined);
                    if(nodes.length==0) {
                        document.getElementById('ow_searchResults').innerHTML = `No results for ${q}!`;
                    } else {
                        document.getElementById('ow_searchResults').innerHTML = '';       
                        var p = document.createElement('p');
                        var strong = document.createElement("strong"); 
                        strong.appendChild(document.createTextNode("Search results from OSM Nominatim"));
                        p.appendChild(strong);
                        document.getElementById('ow_searchResults').appendChild(p);
                        document.getElementById('ow_searchResults').style.display = 'block';    
                        nodes.forEach(o=> {
                            var p = document.createElement('p');
                            p.style.margin = '0px';
                            var a = document.createElement('a');
                            a.href='#';
                            a.innerHTML = o.display_name;
                            a.addEventListener('click', e=> {
                                this.mapMgr.setView([o.lat, o.lon]);
                                document.getElementById('ow_searchResults').style.display='none';    
                            });
                            p.appendChild(a);
                            document.getElementById('ow_searchResults').appendChild(p);

                        });
                }
          });                  
    }

    setupMediaQueries() {
        this.mq = window.matchMedia("(max-width: 600px)");
        this.isMobile = this.mq.matches;
        this.mq.addListener ( mq=> {
            this.isMobile = mq.matches;
        });
    }

    setupMapPreview() {
        this.mapEl.classList.add('preview');
        this.mapMgr.map.invalidateSize();
    }
    
    showProgress (pct, loaded, total) {
        document.getElementById('ow_uploadProgress').innerHTML = 
            pct > 0 ? `Uploaded ${loaded}, total: ${total} (${pct}%)` : "";
        document.getElementById('ow_progress').value = Math.round(pct);
    }


    setupRotation() {
        document.getElementById("ow_anticw").addEventListener("click", this.rotatePano.bind(this, -5, 'pan'));
        document.getElementById("ow_cw").addEventListener("click", this.rotatePano.bind(this, 5, 'pan'));
        document.getElementById('ow_tiltminus').addEventListener('click', this.rotatePano.bind(this, -5, 'tilt'));
        document.getElementById('ow_tiltplus').addEventListener('click', this.rotatePano.bind(this, 5, 'tilt'));
        document.getElementById('ow_rollminus').addEventListener('click', this.rotatePano.bind(this, -5, 'roll'));
        document.getElementById('ow_rollplus').addEventListener('click', this.rotatePano.bind(this, 5, 'roll'));
        document.getElementById('ow_save').addEventListener('click', this.saveRotation.bind(this));
    }       

    rotatePano(ang, component) {
        this.navigator.viewer.rotate(ang, component);
        if(component == 'pan') {
            this.mapMgr.rotatePanoIcon(this.navigator.curPanoId, ang);
        }
    }

    saveRotation() {
        const orientations = Object.assign({}, this.navigator.viewer.orientationCorrection);
        Object.keys(orientations).map ( k => { 
            orientations[k] *= 180/Math.PI; 
        });
        fetch(this.api.rotate.replace('{id}',this.navigator.curPanoId), {
            method: 'POST',
            body: JSON.stringify(orientations),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if(response.status == 200) {
                if(this.events.rotationSaved) {
                    this.events.rotationSaved(orientations);
                } 
                alert('Saved new rotation');
            } else {
                alert(response.status == 401 ? 'This is not your panorama.' : `HTTP error: ${response.status}`);
                
            }
        })
        .catch(e => {
            alert(`ERROR: ${e}`);
        });
    } 

    setupLogin() {
        this.loginDlg = new Dialog(this.dialogParent,
                { 'Login': this.processLogin.bind(this),
                'Cancel': ()=> { this.loginDlg.hide(); }},
                this.dialogStyle,
                { textAlign: "center" });
        this.loginDlg.setContent('<h2>Login</h2>'+
            "<p><span id='ow_loginError' class='error'></span><br />"+
            "<label for='ow_username'>Email address</label><br />" +
            "<input id='ow_username' type='text' /> <br />"+
            "<label for='ow_password'>Password</label><br />" +
            "<input id='ow_password' type='password' /> </p>");
        this.loginDlg.div.id='ow_dlgLogin';
        
        fetch (this.api.login).then(resp => resp.json()).then(json => {
                this.username = json.username;
                this.userid = json.userid;
                this.isadmin = json.isadmin;
                this.onLoginStateChange();
        });
        this.username = null;
        this.userid = 0; 
        this.isadmin = 0; 
        this.onLoginStateChange();
    }    

    setupSignup() {
        this.signupDlg = new Dialog(this.dialogParent,
                { 'Signup': this.processSignup.bind(this),
                'Close': ()=> { this.signupDlg.hide(); }},
                this.dialogStyle,
                {
                padding: '10px',
                textAlign: "center" });
        this.signupDlg.setContent(
"<h2>Sign up</h2>"+
"<p id='ow_signupMsg' class='error'></p>"+
"<p>Signing up will allow you to upload panoramas, view and position your "+
"existing panoramas, and adjust your panoramas (such as rotate and "+
"move them).</p>" +
"<label for='ow_signup_username'>"+
"Enter your email address:"+
"</label>"+
"<br />"+
"<input name='ow_signup_username' id='ow_signup_username' type='text' />"+
"<br /> <label for='ow_signup_password'>Enter a password: </label> <br />"+
"<input name='ow_signup_password' id='ow_signup_password' type='password'/>" +
"<br /> <label for='ow_password2'>Re-enter your password: </label> <br />"+
"<input name='ow_password2' id='ow_password2' type='password'/>"+
"</div>");

        this.signupDlg.div.id = 'ow_dlgSignup';
    }    


    processLogin() {
        var json=JSON.stringify({"username": document.getElementById("ow_username").value,  "password": document.getElementById("ow_password").value});
        fetch(this.api.login, { method: 'POST', headers: {'Content-Type': 'application/json'}, body:json})
            .then(res => {
                if(res.status == 401) {
                   throw('Incorrect login.');
                }
                else return res.json();
             }) 
             .then(json => {
                if(json.error) {
                    document.getElementById("ow_loginError").innerHTML = json.error;
                } else if(json.userid) {
                    this.username = json.username;
                    this.userid = json.userid;
                    this.isadmin = json.isadmin;
                    this.loginDlg.hide();
                    this.onLoginStateChange();
                }
             })
            .catch(e => { 
                document.getElementById('ow_loginError').innerHTML = e;
            });
    }

    processSignup() {
        var json=JSON.stringify({"username": document.getElementById("ow_signup_username").value,  "password": document.getElementById("ow_signup_password").value, "ow_password2": document.getElementById("ow_password2").value});
        fetch(this.api.signup, { method: 'POST', headers: {'Content-Type': 'application/json'}, body:json})
                .then(res => res.json())
                .then(json => {
                    if(json.error) {
                        document.getElementById("ow_signupMsg").innerHTML = json.error;
                    } else if(json.username) {
                        document.getElementById("ow_signupMsg").innerHTML = `Successfully signed up as ${json.username}`; 
                    } else {
                        document.getElementById("ow_signupMsg").innerHTML = 'Failed to add your details.';
                    }
        });
    }

    onLoginStateChange(){
        if(this.userid) {
            this.onLogin();
        } else {
            this.onLogout();
        }
        if(this.mapMgr && this.mapMgr.initialised) {
            this.mapMgr.clearMarkers();
            this.mapMgr.loadPanoramas();
        }
    }

    onLogin() {
        document.getElementById(this.loginContainer).innerHTML = "";
        var t = document.createTextNode(`Logged in as ${this.username}`);
        var a = document.createElement("a");


        document.getElementById(this.loginContainer).appendChild(t);
        document.getElementById(this.loginContainer).appendChild(a);

        a = document.createElement("a");
        a.id="logout";
        a.addEventListener("click", this.logout.bind(this));
        a.appendChild(document.createTextNode(" "));
        a.appendChild(document.createTextNode("Logout"));
        document.getElementById(this.loginContainer).appendChild(a);
        if(this.mode == 1) {
            document.getElementById("ow_drag").style.display = "inline";
            document.getElementById("ow_rotate").style.display = "inline";
            document.getElementById("ow_delete").style.display = "inline";
        } else {
            if(this.uploadContainer) {
                document.getElementById(this.uploadContainer).style.display = "block";
            }
            document.getElementById(this.rotateControlsContainer).style.display = "block";
        }
        this.mapMgr.activated = true;    
        if(this.events.login) {
            this.events.login({
                username: this.username,
                userid: this.userid,
                isadmin: this.isadmin
            });
        }
    }

    onLogout() {
        document.getElementById(this.loginContainer).innerHTML = "";
        var as = document.createElement("a");
//        as.id="signup";
        as.addEventListener("click", this.signupDlg.show.bind(this.signupDlg));
        as.appendChild(document.createTextNode("Sign up"));
        var al = document.createElement("a");
 //       al.id="login";
        al.addEventListener("click", ()=> {
            this.loginDlg.show();
        });
        al.appendChild(document.createTextNode("Login"));
        document.getElementById(this.loginContainer).appendChild(as);
        document.getElementById(this.loginContainer).appendChild(document.createTextNode(" | "));
        document.getElementById(this.loginContainer).appendChild(al);
        if(this.uploadContainer) {
            document.getElementById(this.uploadContainer).style.display = "none";
        }
        document.getElementById(this.rotateControlsContainer).style.display = "none";
        document.getElementById("ow_drag").style.display = "none";
        document.getElementById("ow_rotate").style.display = "none";
        document.getElementById("ow_delete").style.display = "none";
        this.mapMgr.activated = false;    
        if(this.events.logout) {
            this.events.logout();
        }
    } 

    logout() {
        fetch(this.api.logout, {method:"POST"}).then(resp=> {
            this.username = null;
            this.userid = this.isadmin = 0; 
            this.onLoginStateChange();
        });
    }
}

export {
    App
} 
