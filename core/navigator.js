import Viewer from './viewer.js';

/*
 * OpenWanderer.Navigator class
 *
 * Allows navigation. 
 *
 * Contains an OpenWanderer.Viewer object which is responsible for the 
 * conversion between lat/lon and local spherical coordinates within the
 * panorama.
 *
 * Handles navigation to adjacent panoramas; if you click on a panorama you
 * will move to it.
 *
 * Sequence loading behaviour has changed from v0.0.4. 
 * You can now either provide a static pano sequence, or a function which
 * downloads data from an API. Either is specified through the 'sequence'
 * option.
 *
 * The static pano sequence should be an array of objects making up the
 * sequence. Each pano should be an object containing 'panoid', 'lon', 'lat',
 * 'ele', 'pancorrection' and optional 'tiltcorrection' and 'rollcorrection' 
 * properties, as well as an  optional 'image' property for the image itself 
 * (otherwise * the panoImg API * setting with the image ID is used to work 
 * out which image to use).
 * 'pancorrection', 'tiltcorrection' and 'rollcorrection' represent manual
 * corrections of the pan, tilt and roll from the XMP angles.
 *
 * The function should return an object containing these properties:
 * - seqid: the sequence ID (this would typically be provided by an API)
 * - panos: an array of objects representing each pano, with each object
 *   containing 'panoid', 'lon', 'lat', 'ele', 'pancorrection' and optional 
 *  'tiltcorrection' and *  'rollcorrection' properties, as above (again these 
 * would be provided by an API)
 *
 * If neither are supplied, a default sequence provider function will be used
 * which fetches the data from the 'sequnceUrl' API option.
 *
 * Contains code (explicitly marked) created by: 
 * Eesger Toering / knoop.frl / Project GEO Archive                
 *
 * Other code created by Nick Whitelegg (@nickw1 github)
 */

/* Changelog:
 *
 * Please see CHANGELOG for versions beyond 0.0.9 
 *
 * v0.0.9 (09/03/21) - fully working with PSV4.2.1 allowing inherent XMP
 * data to be combined with sphere correction. Pan, tilt and roll are
 * CORRECTIONS to XMP data, NOT the raw values.
 *
 * v0.0.8 (05/03/21) - adapt to work with PSV4.2  though useXmpData must be
 * set to false; viewer.setPanorama() called back from transition module. 
 *
 * v0.0.7 (01/03/21) - remove the external sequence-provider.js and replace 
 * with a default sequence provider.
 *
 * v0.0.5 (27/02/21) - can specify 'image' property in pano JSON for sequences,
 * allowing use of arbitrary images (filename does not need to match image ID)
 *
 * v0.0.4 (26/02/21) - sequence loading behavior changed, as described above.
 *
 * v0.0.3 (22/02/21) - add 'panoTransFunc' option to allow specification of
 * a panorama transition function (to allow transition effects, such as 
 * Eesger's transitions). This function should return a promise, resolving
 * if the transition completed successfully.
 *
 */

class Navigator {

    constructor(options) {
        options = options || { };
        options.api = options.api || { };
        this.sequences = [];
        this.panoMetadata = { };
        this.loadSequence = null;

        if(options.sequence === undefined) {
            this.loadSequence = async(seqid) => {
                const seqResponse = await fetch(this.api.sequenceUrl.replace('{id}', seqid));
                const json = await seqResponse.json();
                const result = { 
                    seqid: seqid,
                    panos: json
                };
                return result;
            };
        } else if (options.sequence instanceof Function){
            this.loadSequence = options.sequence;
        } else if (options.sequence instanceof Array) {
            this.addSequence(1, options.sequence);
        } 
        
        this.viewer = new Viewer(options.element || '#pano', {
            svgEffects: options.svgEffects,
            svgOver: options.svgOver
        });

        this.lat = 0.0;
        this.lon = 0.0;
        this.eventHandlers = {};
        this.resizePano = options.resizePano;
        this.api = Object.assign({ }, options.api);
        this.api.panoImg = this.api.panoImg || 'panorama/{id}.jpg';
        this.api.sequenceUrl = this.api.sequenceUrl || 'sequence/{id}';
        this.api.nearest = this.api.nearest || 'nearest/{lon}/{lat}';
        this.svgEffects = options.svgEffects === undefined ? true: options.svgEffects;
        this.svgOver = options.svgOver || { red: 255, green: 255, blue: 0 };
        this.panoTransFunc = options.panoTransFunc || null;
        this.pathClickHandler = options.pathClickHandler || (marker => {
            let [seqid, idx] = marker.id.split('-').map(n => parseInt(n));
            idx = idx < this.curPanoIdx ?  idx: idx+1;
            return this.sequences[seqid].panos[idx].panoid;
        });
        this.markerClickHandler = options.markerClickHandler || (marker => {
            return parseInt(marker.id.split('-')[2]);
        });

        this.viewer.markersPlugin.on("select-marker", async (e, marker, data) => {
            let id;
            switch(marker.data.type) {
                case 'path':
                    id = this.pathClickHandler(marker);
                    break;
                case 'marker':
                    id = this.markerClickHandler(marker);
                    break;
            }
            if(id !== undefined) await this.loadPanorama(id);
        });
        this.splitPath = options.splitPath || false;
        this.curPanoId = 0;
        this.foundMarkerIds = [];
        this.curPanoIdx = -1;
    }


    async findPanoramaByLonLat(lon,lat) {
        const json = await fetch(this.api.nearest
                .replace('{lon}', lon)
                .replace('{lat}', lat))
                .then(resp=>resp.json());
        await this.loadPanorama(json.id);
    }

    async loadPanorama(id) {
        if(!this.panoMetadata[id] && this.api.byId !== undefined) {
             await this._loadPanoMetadata(id);
        } 

        const panCorrection = this.panoMetadata[id].pancorrection || 0;
        const tiltCorrection = this.panoMetadata[id].tiltcorrection || 0;
        const rollCorrection = this.panoMetadata[id].rollcorrection || 0;

        this.viewer.setRotationCorrection(panCorrection, 'pan');
        this.viewer.setRotationCorrection(tiltCorrection, 'tilt');
        this.viewer.setRotationCorrection(rollCorrection, 'roll');
        
        // the camera is null the first time it loads
        if(this.viewer.psv.renderer.camera !== null && this.panoTransFunc) {
            this.panoTransFunc(id).then( ()=> {
                this._loadMarkers(id)
            });
        } else {
            this.viewer.setPanorama(
                this.resizePano === undefined ? 
                    this.panoMetadata[id].image || this.api.panoImg.replace('{id}', id) : 
                    this.api.panoImgResized
                        .replace('{id}', id)
                        .replace('{width}', this.resizePano)
            ).then( () => { 
                this._loadMarkers(id);
            });
        }
    }

    on(evName,evHandler) {
        this.eventHandlers[evName] = evHandler;
    }

    async _loadMarkers(id) {    
        this.viewer.markersPlugin.clearMarkers();
        if(this.panoMetadata[id] && this.loadSequence && !this.panoMetadata[id].sequence) {
            if(!this.sequences[this.panoMetadata[id].seqid]) {
                this.sequences[this.panoMetadata[id].seqid] = 
                    await this.loadSequence(
                        this.panoMetadata[id].seqid
                    );
            }
            this._onLoadedSequence(
                id, 
                this.sequences[this.panoMetadata[id].seqid]
            );
        } else {
            this.curPanoId = id;
            this._setPano(id);
        }
    }


    async _loadPanoMetadata(id) {
        this.panoMetadata[id] = await fetch(this.api.byId.replace('{id}', id))
            .then(response => response.json());
        this.panoMetadata[id].ele = parseFloat(this.panoMetadata[id].ele);
        return this.panoMetadata[id];
    }

   _onLoadedSequence(origPanoId, sequence) {
        this.panoMetadata[origPanoId].sequence = sequence;
        this.curPanoId = origPanoId;
        this._doSetupSequence(sequence);
        this._setPano(origPanoId);
    }
    
    addSequence(seqid, sequence) {
        this.sequences[seqid] = { 'seqid': seqid, "panos": sequence };
        this._doSetupSequence(this.sequences[seqid]);
    }

    _doSetupSequence(sequence) {
        sequence.panos.forEach ( (pano, i) => {
            if (!this.panoMetadata[pano.panoid]) {
                this.panoMetadata[pano.panoid] = Object.assign({
                    seqid: /*this.panoMetadata[origPanoId].*/sequence.seqid
                }, pano);
            }
            if(!this.panoMetadata[pano.panoid].sequence) {
                this.panoMetadata[pano.panoid].sequence = sequence;
            }
            if(pano.panoid == this.curPanoId) {
                this.curPanoIdx = i;
            }
        });    
    }

    _setPano(id) { 
        this._emitPanoChangeEvents(id);
        this.viewer.setLonLat(this.panoMetadata[id].lon, this.panoMetadata[id].lat);
        this.viewer.setElevation(this.panoMetadata[id].ele + 1.5);
        //this.viewer.setElevation(1.5);
        this._createPaths(id);
    }

    _emitPanoChangeEvents(id) {
        this.curPanoId = id;

        if(this.eventHandlers.panoChanged) {
            this.eventHandlers.panoChanged(id);
        }

        if(this.eventHandlers.locationChanged) {
            this.eventHandlers.locationChanged(
                this.panoMetadata[id].lon, 
                this.panoMetadata[id].lat
            );
        }
    }

    _createPaths(id) {
        if (this.panoMetadata[id].sequence && this.panoMetadata[id].sequence.seqid > 0) {
            const path = this.panoMetadata[id].sequence.panos.map ( pano => [pano.lon, pano.lat, parseFloat(pano.ele)] );
            this.panoMetadata[id].sequence.panos.forEach ( pano => {
                pano.key = `marker-${id}-${pano.panoid}`;
                this.viewer.addMarker([pano.lon, pano.lat, pano.ele], { 
                    id : pano.key, 
                    tooltip: `Location of pano ${pano.panoid}` 
                } );
            });
            this.panoMetadata[id].sequence.key = `path-${id}-${this.panoMetadata[id].sequence.seqid}`;
            this.viewer.addPath(path, { 
                tooltip: `sequence ${this.panoMetadata[id].sequence.seqid}`,
                id: this.panoMetadata[id].sequence.seqid,
                degDown: 1,
                splitPath: this.splitPath,
            });
        }
    }

    async update(id, properties) {
        if(this.panoMetadata[id]) {
            if(properties.position) {
                this.panoMetadata[id].lon = properties.position[0];
                this.panoMetadata[id].lat = properties.position[1];
            } else if (properties.pan) {
                this.panoMetadata[id].pan = properties.pan;
            }

            if(this.curPanoId == id) {    
                await this.loadPanorama(id);
            }
        }
    }
}

//module.exports = Navigator;
export default Navigator;
