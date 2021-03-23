import * as PhotoSphereViewer from 'photo-sphere-viewer';
import MarkersPlugin  from 'photo-sphere-viewer/dist/plugins/markers';
import { geodeticToEnu, enuPlusMarkerdata } from './coordtrans.js';

/*
 * OpenWanderer.Viewer
 *
 * The main OpenWanderer viewer class.
 *
 * Contains a Photo Sphere Viewer object but allows addition of markers and
 * polylines using real-world longitudes and latitudes, as opposed to 
 * local spherical or pixel coordinates.
 *
 * Uses Photo Sphere Viewer (https://photo-sphere-viewer.js.org); this must
 * be included in your page, either via a CDN or npm installation.
 *
 * In addition to this class's own methods, the methods of the underlying PSV 
 * viewer can be accessed using the 'psv' property.
 */

class Viewer {

    /* Constructor
     *
     * Takes a single argument: the CSS selector for the viewer's container.
     */
    constructor(container, options = {}) {
        this.lon = 181;
        this.lat = 91;
        this.elev = 0;
        this.orientationCorrection = {
            pan: 0,
            tilt: 0,
            roll: 0
        };
        this.curMarkerId = 0;
        this.curPathId = 0;
        this.psv = new PhotoSphereViewer.Viewer({
            sphereCorrectionReorder: true,
            container: document.querySelector(container || '#viewer'),
            plugins: [
                MarkersPlugin
            ]
        });
        this.markersPlugin = this.psv.getPlugin(MarkersPlugin);
        this.rotationLimits = {
            pan: [0, Math.PI*2],
            tilt: [-Math.PI*0.5, Math.PI*0.5],
            roll: [-Math.PI, Math.PI]
        };

        this.svgEffects = options.svgEffects === undefined ? true: options.svgEffects;
        this.svgOver = options.svgOver || { red: 255, green: 255, blue: 0 };

        // SVG was developed by Eesger Toering
        if(this.svgEffects) {
            const svgString = `rgba(${this.svgOver.red},${this.svgOver.green},${this.svgOver.blue}`;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttributeNS(null, 'height', 1);
            svg.setAttributeNS(null, 'width', 1);
            svg.style.position = 'absolute';
            svg.style.top = '-1px';
            svg.style.left = '-1px';
            svg.innerHTML = '<defs>' +
                '<radialGradient id="GAgradient1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">' +
                ` <stop offset="0%" stop-color="${svgString},1.0)"/>` + 
                ` <stop offset="25%"  stop-color="${svgString},1.0)"/>` +
                ` <stop offset="100%" stop-color="${svgString},0.4)"/>`+
                ' </radialGradient>' +
                ' <radialGradient id="GAgradient0" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">' +
                ` <stop offset="0%"   stop-color="${svgString}, 0.5)"/>`+
                ` <stop offset="100%" stop-color="${svgString}, 0.5)"/>` +
                ' </radialGradient>' +
                '<linearGradient id="GAgradient0T" x2="0" y2="1">' +
                `<stop offset="0%"   stop-color="${svgString}, 0.35)"/>` +
                `<stop offset="100%" stop-color="${svgString}, 0.35)"/>` +
                ' </linearGradient>' +
                '<linearGradient id="GAgradient2T" x2="0" y2="1">' +
                `<stop offset="0%"   stop-color="${svgString}, 0.35)"/>` +
                ` <stop offset="10%"  stop-color="${svgString}, 0.35)"/>` + 
                ` <stop offset="100%" stop-color="${svgString}, 0.85)"/>`+
                ' </linearGradient>' +
                ' <linearGradient id="GAgradient3T" x2="0" y2="1">' +
                `<stop offset="0%"   stop-color="${svgString}, 0.85)"/>` +
                `<stop offset="90%"  stop-color="${svgString}, 0.35)"/>` +
                `<stop offset="100%" stop-color="${svgString}, 0.35)"/>` +
                '</linearGradient>' +
                '</defs>';
            document.body.appendChild(svg);
        }
        this.markersPlugin.on('over-marker', (e, marker) => {
            this._markerOver(marker.id);
        });
            
        this.markersPlugin.on('leave-marker', (e, marker) => {
            this._markerLeave(marker.id);
        });
    }

    /* setLonLat()
     *
     * Set the current longitude and latitude; would typically be provided by
     * the pano's metadata (returned from an API)
     */
    setLonLat(lon, lat) {
        this.lon = lon;
        this.lat = lat;
    }

    /* setElevation()
     *
     * Set the current elevation; would typically be provided by
     * the pano's metadata (returned from an API)
     */
    setElevation(elev) {
        this.elev = elev;
    }

    /* setRotationCorrection()
     *
     * Set the current panorama correction (pan, yaw) or tilt (pitch) / roll; 
     * would  typically be provided by the pano's metadata (returned from an 
     * API)
     *
     * IMPORTANT: Note that the angle is specified in degrees but stored
     * internally as radians.
     *
     * Note that this does not actually live-rotate an existing panorama.
     * It's intended to set the angle BEFORE a new panorama is loaded.
     * Use rotate(), below, to live-rotate an existing pano.
     */
    setRotationCorrection(angle, component='pan') {
        this._doSetRotation(angle * (Math.PI / 180.0), component);
    }

    /* _doSetRotation()
     *
     * Sets the rotation angle correction in radians, ensuring it's between 
     * appropriate limits.
     */

    _doSetRotation(angleRad, component='pan') {
        this.orientationCorrection[component] = angleRad;
        const rotationRange = this.rotationLimits[component][1] - this.rotationLimits[component][0];
        if (this.orientationCorrection[component] > this.rotationLimits[component][1]) this.orientationCorrection[component] -= rotationRange;
        if (this.orientationCorrection[component] < this.rotationLimits[component][0]) this.orientationCorrection[component] += rotationRange; 
    }

    /* setPanorama()
     *
     * Set the current panorama by calling the PSV Viewer's setPanorama();
     * ensures that the sphere correction is equal to current pan/tilt/roll, 
     * allowing the panorama to be corrected by the correct amount. 
     *
     * Returns: the Promise returned by the PSV Viewer's setPanorama(). 
     */
    setPanorama(panorama, options = {}) {
        return this.psv.setPanorama(panorama, Object.assign({
            sphereCorrection: { 
                pan: -this.orientationCorrection.pan,
                tilt: -this.orientationCorrection.tilt,
                roll: -this.orientationCorrection.roll
            }
        }, options));
    }

    /* rotate()
     *
     * Rotates the current panorama by the given angle (either pan, tilt, roll)
     *
     * Sets the orientation attribute and changes the sphereCorrection option
     * of the underlying PSV viewer.
     */
    rotate(diff, component='pan') {
        this._doSetRotation(this.orientationCorrection[component] + diff*(Math.PI/180), component);
        this.psv.setOption('sphereCorrection', { pan: -this.orientationCorrection.pan, tilt: -this.orientationCorrection.tilt, roll: -this.orientationCorrection.roll } );
    }

    /* addMarker()
     *
     * Add a marker at a given (geographic, WGS84) lon/lat/elevation.
     * Elevation is optional.
     *
     * Returns: the ID of the marker.
     */
    addMarker(lonLatElev, options = {}) {
        const sphericalCoords = this.calcSphericalCoords([lonLatElev]);
        const id = options.id || `marker-${++this.curMarkerId}`;
        let scale;
        const yp = sphericalCoords.yawPitchDist[0];
        scale = yp[2] < 0.001 ? 10 : (options.scale || 1) * 10 * (1/yp[2]);
        this.markersPlugin.addMarker({
            id: id, 
            tooltip: options.tooltip || 'marker', 
            latitude: yp[1], 
            longitude: yp[0], 
  
           // the rest based on Eesger's example
           // source for path: https://commons.wikimedia.org/wiki/File:Map_marker.svg
          path       : options.path || 'M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9 C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8 c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z',
          svgStyle:  {
            fill       : options.fill || 'rgba(255, 255, 0, 0.4)',
            stroke     : options.stroke || 'rgb(255, 255, 0, 1.0)',
            strokeWidth: options.strokeWidth || '2px'
          },
          anchor     : '52% 102%',
          scale      : [scale, scale],
          data : { 
            type: 'marker'
          }
        });
        return id; 
    }

    /* addPath()
     *
     * Add a path of a given width in metres. 
     * 'lonLatElevs' is an array of (WGS84) lon/lat/elev for each point on the path.
     *
     * Elevations are optional.
     *
     * Returns: the ID of the path.
     */
    addPath(lonLatElevs, options = {}) {
        const sphericalCoords = this.calcSphericalCoords(lonLatElevs, options.width || 1, options), id = options.id || `path-${++this.curPathId}`;
        if(options.splitPath === true) {
            sphericalCoords.path.forEach ( (polygon,i) => {
                this.markersPlugin.addMarker({
                    id: `${id}-${i}`,
                    polylineRad: polygon, 
                    svgStyle: {
                        fill: options.fill || 'rgba(255, 255, 0, 0.4)',
                        stroke: options.stroke || 'rgba(255, 255, 0, 1.0)',
                    },
                    tooltip: `Sequence ${id}`,
                    data: {
                        type: 'path'
                    }
                });
            });
        } else {
            this.markersPlugin.addMarker({
                id: id,
                polylineRad: sphericalCoords.path,
                svgStyle: {
                    fill: options.fill || 'rgba(255, 255, 0, 0.4)',
                    stroke: options.stroke || 'rgba(255, 255, 0, 1.0)',
                },
                tooltip: options.tooltip || 'Path',
                data: {
                    type: 'path'
                }
            });
        }
        return id;
    }

    /* calcSphericalCoords()
     *
     * Input : an array of lon/lat/(optional elevation) points plus 'pathWidth'
     * If 'pathWidth' is specified, it will create spherical coords 
     * for a polygon to represent a path of that width (in metres).
     *
     * Returns: 
     *
     * an object containing up to two properties:
     *
     * - yawPitchDist (always returned): an array of yaw/pitch/distance values 
     * for each marker;
     *
     * - path (only returned if pathWidth is defined): yaw/pitch/distance for 
     * a polygonal path of a given width defined by the input points 
     */
    calcSphericalCoords(points, pathWidth, options={}) {
        const values = {
            yawPitchDist: [],
            path: []
        };

        const projectedCoords = [];
        points.forEach ( point => {
            let b = geodeticToEnu(point[1], point[0], point[2] === undefined ? -1.5: point[2], this.lat, this.lon, this.elev || 0);

            projectedCoords.push([b[0], b[1], b[2]]); 

            // based on Eesger's code to adjust downwards
            if(options.degDown) {
                b[3] = Math.sqrt(b[0]*b[0] + b[1]*b[1]);
                b[2] -= Math.sin(options.degDown * Math.PI/180) * b[3];
            }

            b = enuPlusMarkerdata(b, (this.psv.prop.panoData.poseHeading || 0) * (Math.PI/180) + this.orientationCorrection.pan);

            values.yawPitchDist.push([b[5], b[4], b[3]]);
        });
        if(pathWidth !== undefined) {
            values.path = this._createPath(projectedCoords, pathWidth, options.splitPath);
        }
        return values;
    }

    /* _createPath()
     *
     * Internal method to create a path
     * Input: a projected polyline (ENU)
     * Returns: yaw/pitch of a polygon of the given width 
     */
    _createPath(projectedCoords, width, split=false) {
        // ASSUMPTION projectedCoords[0] is easting, [1] is northing, [2] is elevation
        const path = [];
        const polyProj = this._createPathPolygon(projectedCoords, width);
        polyProj.forEach ( p => {
             // Because the polygon coords are in the correct reference frame, this will work...
            let b = geodeticToEnu(p[1], p[0], p[2] === undefined ? -1.5: p[2], this.lat, this.lon, this.elev || 0);
            b = enuPlusMarkerdata(p, (this.psv.prop.panoData.poseHeading || 0) * (Math.PI/180) + this.orientationCorrection.pan);
            path.push([b[5], b[4]]);
        });
        return split ? this._splitPolygon(path) : path;
    }


    /* _createPathPolygon()
     *
     * Internal method to create a polygon representing a path of a given
     * width, from an array of coordinates
     *
     * Input: an array of projected (metre) coordinates as a path
     * Returns: an array of projected (metre) coordinates of a particular width as a polygon
     */
    _createPathPolygon(projectedPath, width=1) {
        const polygon = new Array(projectedPath.length * 2);
        let dx, dy, len, dxperp, dyperp, thisVtxProvisional, nextVtxProvisional;
        const k = projectedPath.length - 1;
        for(let i=0; i<k; i++) {
            dx = projectedPath[i+1][0] - projectedPath[i][0];
            dy = projectedPath[i+1][1] - projectedPath[i][1];
            len = Math.sqrt(dx*dx + dy*dy);
            dxperp = dy * (width/2) / len;
            dyperp = dx * (width/2) / len;
            thisVtxProvisional = [    
                projectedPath[i][0] - dxperp,
                projectedPath[i][1] + dyperp,
                projectedPath[i][2],
                projectedPath[i][0] + dxperp,
                projectedPath[i][1] - dyperp,
                projectedPath[i][2]
            ];
            if(i > 0) {
                thisVtxProvisional.forEach( (vtx,j) => {    
                    if(j<2) vtx = (vtx + nextVtxProvisional[j]) / 2;
                });
            }
            polygon[i] = [ thisVtxProvisional[0], thisVtxProvisional[1], thisVtxProvisional[2] ];
            polygon[polygon.length-i-1] = [ thisVtxProvisional[3], thisVtxProvisional[4], thisVtxProvisional[5] ];
            nextVtxProvisional = [    
                projectedPath[i+1][0] - dxperp,
                projectedPath[i+1][1] + dyperp,
                projectedPath[i+1][2],
                projectedPath[i+1][0] + dxperp,
                projectedPath[i+1][1] - dyperp,
                projectedPath[i+1][2]
            ];
        }
        
        polygon[k] = [ 
             projectedPath[k][0] - dxperp,
             projectedPath[k][1] + dyperp,
             projectedPath[k][2]
            
        ];
        polygon[k+1] = [ 
            projectedPath[k][0] + dxperp,
            projectedPath[k][1] - dyperp,
            projectedPath[k][2]
            
        ];

        return polygon;
    }

    /* _splitPolygon()
     *
     * Internal method to split a polygon representing a path of a given
     * width into subpolygons, one pano to another.
     *
     * This is allow us to navigate to another pano by clicking on the path.
     *
     * Input: an array of projected (metre) coordinates of a particular width as a polygon
     * Output: an array of arrays containing the subpolygons
     */
    _splitPolygon(polygon) {
        const multipolygon=[]; 
        for(let i=0; i<polygon.length / 2 - 1; i++) {    
            multipolygon.push([
                polygon[i],
                polygon[i+1],
                polygon[polygon.length-2-i],
                polygon[polygon.length-1-i]
            ]);
        }
        return multipolygon;
    }

    // Code originally by Eesger Toering; modified
    _markerOver(markerID) {
        if (!this.svgEffects) return;

        const marker = this.markersPlugin.markers[markerID];
        if (!marker
            ||  marker.type == 'image'
            || !marker.config.svgStyle
            || !marker.config.svgStyle.fill) { 
            return; 
         }

         if (this.markerBaseFill === undefined) {
             this.markerBaseFill = marker.config.svgStyle.fill;
         }
         let fillNew = 'url(#GAgradient1)';

  
         this.markersPlugin.updateMarker({
            id   : markerID,
            svgStyle : {
                  fill       : fillNew,
                  stroke     : this.markerBaseFill.replace(/([0-9.]+)\)/, 
                    (x,y)=> parseFloat(y)/4+')' 
                   ),
              strokeWidth: '1px',//'0.1em',
            },
         });
    }

    // Code originally by Eesger Toering; modified
    _markerLeave(markerID) {  
        if (!this.svgEffects) return;

        const marker = this.markersPlugin.markers[markerID];
  
        let fillNew = this.markerBaseFill;
        if (!marker
            ||  marker.type == 'image'
            || !marker.config.svgStyle
            || !marker.config.svgStyle.fill) { 
            return; 
        }


        this.markersPlugin.updateMarker({
            id   : markerID,
            svgStyle : {
                 fill       : fillNew,
            },
        });
    }
}

export default Viewer;
