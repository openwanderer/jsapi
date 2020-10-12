import jsfreemaplib from 'jsfreemaplib';
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
 * Does not yet handle clicks on routes to panoramas.
 *
 * Designed to work with a range of 'nearby panorama providers'. The
 * 'loadNearbysFunc' option allows you to specify a function which will
 * return an object containing nearby panoramas and routes to those panoramas.
 * It should contain a 'routes' property containing an array of routes 
 * (to nearby panos along a given bearing). Each route should have a path
 * (array of points: each point should be an array containing actual WGS84 
 * coords together with elevation in metres) together with an array of panos
 * along that path (each pano should be an object containing id, lon, lat and
 * altitude properties).
 */
class Navigator {

    constructor(options) {
        options = options || { };
        options.api = options.api || { };
        this.loadNearbysFunc = options.loadNearbysFunc;
        this.viewer = new Viewer(options.element || '#pano');
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
        this.arrowImage = options.arrowImage || 'images/arrow.png';
        this.curPanoId = 0;
        this.foundMarkerIds = [];
        this.sphMerc = new jsfreemaplib.GoogleProjection();
    }


    async findPanoramaByLonLat(lon,lat) {
        const json = await fetch(this.api.nearest
                .replace('{lon}', lon)
                .replace('{lat}', lat))
                .then(resp=>resp.json());
        await this.loadPanorama(json.id);
    }

    async loadPanorama(id) {
        if(!this.panoMetadata[id]) {
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

    async update(id, properties) {
        if(this.panoMetadata[id]) {
            if(properties.position) {
                this.panoMetadata[id].lon = properties.position[0];
                this.panoMetadata[id].lat = properties.position[1];
            } else if (properties.poseheadingdegrees) {
                this.panoMetadata[id].poseheadingdegrees = properties.poseheadingdegrees;
            }

            this.panoMetadata[id].routes = null;

            if(this.curPanoId == id) {    
                await this.loadPanorama(id);
            }
        }
    }

    on(evName,evHandler) {
        this.eventHandlers[evName] = evHandler;
    }

    async _loadMarkers(id) {    
        this.viewer.markersPlugin.clearMarkers();
        if(!this.panoMetadata[id].routes) {
            const routes = await this.loadNearbysFunc(
                this.panoMetadata[id]
            );
            this._onFoundNearbys(id, routes);
        } else {
              this._setPano(id);
        }
    }


    async _loadPanoMetadata(id) {
        this.panoMetadata[id] = await fetch(this.api.byId.replace('{id}', id))
                                .then(response => response.json());
        return this.panoMetadata[id];
    }

   _onFoundNearbys(origPanoId, routes) {
        this.panoMetadata[origPanoId].routes = routes.paths;
        this.panoMetadata[origPanoId].altitude = routes.altitude;
        this._setPano(origPanoId);
    }

    _setPano(id) { 
        this._setPanoId(id);
        this.viewer.setLonLat(this.panoMetadata[id].lon, this.panoMetadata[id].lat);
        this.viewer.setElevation(this.panoMetadata[id].altitude + 1.5);
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
        this.panoMetadata[id].routes.forEach ( route => {
            route.panos.forEach ( pano => {
                pano.key = `marker-${id}-${pano.id}`;
                this.viewer.addMarker([pano.lon, pano.lat, pano.altitude], { 
                    id : pano.key, 
                    tooltip: `Location of pano ${pano.id}` 
                } );
            } );
            route.key = `path-${id}-${route.bearing}`;
            this.viewer.addPath(route.path, { 
                tooltip: `bearing ${route.bearing}`, 
                id: route.key 
            });
        });
    }
}

export default Navigator;