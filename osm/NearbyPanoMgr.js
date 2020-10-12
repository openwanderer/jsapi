import jsfreemaplib from 'jsfreemaplib';
const BoundingBox = jsfreemaplib.BoundingBox;
import JunctionManager from './JunctionManager';
import turfPoint from 'turf-point';
import turfBearing from '@turf/bearing';
import NetworkMgr from './NetworkMgr';
import DemTiler from 'jsfreemaplib/demtiler'; 
const DEM = jsfreemaplib.DEM; 

class NearbyPanoMgr {

    constructor(options) {
        this.options = options || { };
        this.options.jsonApi = this.options.jsonApi || 'op/map/highways';
        this.options.nearbyApi = this.options.nearbyApi || 'op/panorama/{id}/nearby';
        this.networkMgr = new NetworkMgr({
            distThreshold : 0.005
        });
        this.tiler = new DemTiler('/terrarium/{z}/{x}/{y}.png');
        this.sphMerc = new jsfreemaplib.GoogleProjection();
    }

    // 'json' is the current panorama
    async doLoadNearbys (json) {
         const panos = [];
         json.lon = parseFloat(json.lon);
         json.lat = parseFloat(json.lat);
         json.poseheadingdegrees = parseFloat(json.poseheadingdegrees);

         const sphMercPos = this.sphMerc.project(json.lon, json.lat);
        
         const dem = await this.tiler.getData(sphMercPos);
         const altitude = dem.getHeight(sphMercPos[0], sphMercPos[1]); 
         const nearbys = await fetch(this.options.nearbyApi.replace('{id}',json.id)).then(resp => resp.json());
         const geojson = await fetch(`${this.options.jsonApi}?bbox=${nearbys.bbox.join(",")}`).then(resp => resp.json());
         panos.push(json);
         for(const nearby of nearbys.panos) {
            nearby.lon = parseFloat(nearby.lon);
            nearby.lat = parseFloat(nearby.lat);
            const panoSphMerc = this.sphMerc.project(nearby.lon, nearby.lat);
            const panoDem = await this.tiler.getData(panoSphMerc);
            nearby.altitude = panoDem.getHeight(panoSphMerc[0], panoSphMerc[1]);
            nearby.poseheadingdegrees = parseFloat(nearby.poseheadingdegrees);
            panos.push(nearby);
        } 
        this.networkMgr.update(geojson, panos);
        const groupedRoutes = this.networkMgr.route (
            [json.lon, json.lat], 
            panos.filter( pano => pano.id != json.id), {
                snapToJunction: true
            }
        );
        // groupedRoutes is an array of arrays; outer array represents each
        // bearing then inner array is each route starting at that bearing
        // has been sorted so the first member of the inner array will be
        // the nearest panorama along that route
		// each has : bearing weight path
//        const adjacents = groupedRoutes.map ( groupForBearing => groupForBearing[0] );

		// reorganise to a series of routes-to-furthest with panos along the way
        const paths = groupedRoutes.map ( groupForBearing => { return { path: groupForBearing.pois[groupForBearing.pois.length - 1].path, panos: groupForBearing.pois, bearing: groupForBearing.bearing } }  );
        // Add altitudes to all paths to adjacents
        // now do for furthests instead, this is what we want
 //       for(const adjacent of adjacents) {
		  for(const path of paths) {
//            for(const pt of adjacent.path) {
              for(const pt of path.path) {
                const routeSphMerc = this.sphMerc.project(pt[0], pt[1]);
                const routeDem = await this.tiler.getData(routeSphMerc);
                pt[2] = routeDem.getHeight(routeSphMerc[0], routeSphMerc[1]);
            }
        }

		console.log(paths);

		// Now only return paths-to-furthest with panos along the way
        return  {
//            nearbys: nearbys.panos, // ALL panos (e.g. to render them)
            //adjacents: adjacents, // the adjacents only
            paths: paths,
            altitude: altitude // altitude of THIS pano, use to set scene altitude
         };
   }    
}

export default NearbyPanoMgr;
