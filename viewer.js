const coordtrans = require('./coordtrans');

/*
 * OpenWanderer.Viewer
 *
 * The main OpenWanderer viewer class.
 *
 * Contains a Photo Sphere Viewer object but allows addition of markers and
 * polylines using real-world longitudes and latitudes, as opposed to 
 * local spherical or pixel coordinates.
 *
 * Depends on photo-sphere-viewer; please install with
 *     npm install
 *
 * In addition to this class's own methods, the methods of the underlying PSV 
 * viewer can be accessed using the 'psv' property.
 */

class Viewer {

    /* Constructor
     *
     * Takes a single argument: the CSS selector for the viewer's container.
     */
    constructor(container) {
        this.lon = 181;
        this.lat = 91;
        this.elev = 0;
        this.heading = 0;
        this.curMarkerId = 0;
        this.curPathId = 0;
        this.psv = new PhotoSphereViewer.Viewer({
            container: document.querySelector(container || '#viewer'),
            plugins: [
                PhotoSphereViewer.MarkersPlugin
            ]
        });
        this.markersPlugin = this.psv.getPlugin(PhotoSphereViewer.MarkersPlugin);
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

    /* setHeading()
     *
     * Set the current panorama heading; would typically be provided by
     * the pano's metadata (returned from an API)
     *
     * IMPORTANT: Note that the heading is specified in degrees but stored
     * internally as radians.
     *
     * Also IMPORTANT: Incorrect results are obtained if the heading is
     * between 180 and 360. Must be in range -180 -> 0 -> 180. TODO: investigate
     * why this is.
     */
    setHeading(heading) {
        this.heading = heading * Math.PI / 180.0;
    }

    /* setPanorama()
     *
     * Set the current panorama by calling the PSV Viewer's setPanorama();
     * ensures that the sphere correction is equal to the current heading, 
     * allowing the panorama to be corrected by the correct amount. 
     *
     * Returns: the Promise returned by the PSV Viewer's setPanorama(). 
     */
    setPanorama(panorama) {
        return this.psv.setPanorama(panorama, {
            sphereCorrection: { pan: -this.heading }
        });
    }

    /* addMarker()
     *
     * Add a marker at a given (geographic, WGS84) lon/lat/elevation.
     * Elevation is optional.
     *
     * Returns: the ID of the marker.
     */
    addMarker(lonLatElev, options = {}) {
        const sphericalCoords = this._calcSphericalCoords([lonLatElev]);
        const id = options.id || `marker-${++this.curMarkerId}`;
        let scale;
        const yp = sphericalCoords.yawPitchDist[0];
        scale = (options.scale || 1) * 10 * (1/yp[2]);
        this.markersPlugin.addMarker({
            id: id, 
            tooltip: options.tooltip || 'marker', 
            latitude: yp[1], 
            longitude: yp[0], 
  
           // the rest based on Eesger's example
           // source for path: https://commons.wikimedia.org/wiki/File:Map_marker.svg
          path       : options.path || 'M182.9,551.7c0,0.1,0.2,0.3,0.2,0.3S358.3,283,358.3,194.6c0-130.1-88.8-186.7-175.4-186.9 C96.3,7.9,7.5,64.5,7.5,194.6c0,88.4,175.3,357.4,175.3,357.4S182.9,551.7,182.9,551.7z M122.2,187.2c0-33.6,27.2-60.8,60.8-60.8 c33.6,0,60.8,27.2,60.8,60.8S216.5,248,182.9,248C149.4,248,122.2,220.8,122.2,187.2z',
          svgStyle:  {
            fill       : options.fill || 'rgba(255, 255, 0, 0.5)',
            stroke     : options.stroke || 'rgb(255, 255, 1.0)',
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
        const sphericalCoords = this._calcSphericalCoords(lonLatElevs, options.width || 1), id = options.id || `path-${++this.curPathId}`;
        this.markersPlugin.addMarker({
            id: id,
            polylineRad: sphericalCoords.path,
            svgStyle: {
                fill: options.fill || 'rgba(255, 255, 0, 0.5)',
                stroke: options.stroke || 'rgba(255, 255, 0, 1.0)',
            },
            tooltip: options.tooltip || 'Path',
            data: {
                type: 'path'
            }
        });
        return id;
    }

    /* _calcSphericalCoords()
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
    _calcSphericalCoords(points, pathWidth) {
        const values = {
            yawPitchDist: [],
            path: []
        };

        const projectedCoords = [];
        points.forEach ( point => {
            let b = coordtrans.geodeticToEnu(point[1], point[0], point[2] === undefined ? -1.5: point[2], this.lat, this.lon, this.elev || 0);

            projectedCoords.push([b[0], b[1], b[2]]); 

            b = coordtrans.enuPlusMarkerdata(b, this.heading); 

            values.yawPitchDist.push([b[5], b[4], b[3]]);
        });
        if(pathWidth !== undefined) {
            values.path = this._createPath(projectedCoords, pathWidth);
        }
        return values;
    }

    /* _createPath()
     *
     * Internal method to create a path
     * Input: a projected polyline (ENU)
     * Returns: yaw/pitch of a polygon of the given width 
     */
    _createPath(projectedCoords, width) {
        // ASSUMPTION projectedCoords[0] is easting, [1] is northing, [2] is elevation
        const path = [];
        const polyProj = this._createPathPolygon(projectedCoords, width);
        polyProj.forEach ( p => {
             // Because the polygon coords are in the correct reference frame, this will work...
            let b = coordtrans.geodeticToEnu(p[1], p[0], p[2] === undefined ? -1.5: p[2], this.lat, this.lon, this.elev || 0);
            b = coordtrans.enuPlusMarkerdata(p, this.heading);
            path.push([b[5], b[4]]);
        });
        return path;
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
}

module.exports = Viewer; 
