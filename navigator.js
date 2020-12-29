const Viewer = require('./viewer');
const GANav = require('./ganav');

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
 * Does not yet handle clicks on routes to panoramas.
 *
 * Designed to work with a range of 'sequence providers'. The
 * 'loadSequence' option allows you to specify a function which will
 * return an object containing the sequence(s) that the current panorama 
 * belongs to.
 *
 * It should return the sequence that the panorama belongs to. 
 * Each sequence should have a 'path' property (array of points: each point 
 * should be an array containing actual WGS84 coords together with elevation 
 * in metres) together with a 'panos' property containing an array of panos 
 * along that path (each pano should be an object containing 'panoid',
 * 'lon', 'lat', 'ele' and 'poseheadingdegrees' properties)
 */
class Navigator {

    constructor(options) {
        options = options || { };
        options.api = options.api || { };
        this.loadSequence = options.loadSequence;
        this.viewer = new Viewer(options.element || '#pano');
        this.gaNav = options.gaNav ? new GANav(this) : null; // use Eesger's new navigation code?
        this.lat = 0.0;
        this.lon = 0.0;
        this.eventHandlers = {};
        this.resizePano = options.resizePano;
        this.api = { };
        this.api.nearest = options.api.nearest;
        this.api.byId = options.api.byId;  
        this.api.panoImg = options.api.panoImg; 
        this.api.panoImgResized = options.api.panoImgResized; 
        this.panoMetadata = { };
        if(!this.gaNav) {
            this.viewer.markersPlugin.on("select-marker", async (e, marker, data) => {
            let id;
            switch(marker.data.type) {
                case 'path':
                    alert('Click on path not implemented yet');
                    break;
                case 'marker':
                    id = parseInt(marker.id.split('-')[2]);
                    break;
            }
            if(id !== undefined) await this.loadPanorama(id);
            });
        }
        this.arrowImage = options.arrowImage || 'images/arrow.png';
        this.curPanoId = 0;
        this.foundMarkerIds = [];
        this.sequences = [];
        this.imageNow = 0;
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


        const heading = this.panoMetadata[id].poseheadingdegrees > 180 ? 
            this.panoMetadata[id].poseheadingdegrees - 360 : 
            this.panoMetadata[id].poseheadingdegrees;

        this.viewer.setHeading(heading);
        this.viewer.setPanorama(
            this.resizePano === undefined ? 
                this.api.panoImg.replace('{id}', id) : 
                this.api.panoImgResized
                    .replace('{id}', id)
                    .replace('{width}', this.resizePano)
        ).then( () => { 
            this._loadMarkers(id);
        });
    }

    on(evName,evHandler) {
        this.eventHandlers[evName] = evHandler;
    }

    async _loadMarkers(id) {    
		console.log(`_loadMarkers: ${id}`);
        this.viewer.markersPlugin.clearMarkers();
        if(!this.panoMetadata[id].sequence) {
			console.log('loading sequence');
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
		console.log(`onLoadedSequence: origPanoId=${origPanoId}`);
        this.panoMetadata[origPanoId].sequence = sequence;
        sequence.panos.forEach ( (pano, i) => {
			console.log(`Panoid in sequence ${pano.panoid}`);
            if (!this.panoMetadata[pano.panoid]) {
                this.panoMetadata[pano.panoid] = Object.assign({
                    seqid: this.panoMetadata[origPanoId].seqid
                }, pano);
            }
            if(pano.panoid == origPanoId) {
                this.imageNow = i;
            }
        });    
        this._setPano(origPanoId);
    }

    _setPano(id) { 
        this._setPanoId(id);
        this.viewer.setLonLat(this.panoMetadata[id].lon, this.panoMetadata[id].lat);
        this.viewer.setElevation(this.panoMetadata[id].ele + 1.5);
        //this.viewer.setElevation(1.5);
        this._createPaths(id);
    }

    _setPanoId(id) {
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
        if(this.gaNav) {
            this.gaNav.createPaths(id);
        } else {
            this.panoMetadata[id].sequence.panos.forEach ( pano => {
                pano.key = `marker-${id}-${pano.panoid}`;
                this.viewer.addMarker([pano.lon, pano.lat, pano.ele], { 
                    id : pano.key, 
                    tooltip: `Location of pano ${pano.panoid}` 
                } );
            });
            this.panoMetadata[id].sequence.key = `path-${id}-${this.panoMetadata[id].sequence.seqid}`;
            this.viewer.addPath(this.panoMetadata[id].sequence.path, { 
                tooltip: `sequence ${this.panoMetadata[id].sequence.seqid}`, 
                id: this.panoMetadata[id].sequence.key 
            });
        }
    }
}

module.exports = Navigator;
