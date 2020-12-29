/*             Code originally created by:                                    */
/*            Eesger Toering / knoop.frl / Project GEO Archive                */
/*         Modified (WIP) to fit with the remaining OpenWanderer jslib code   */

const coordtrans = require('./coordtrans');

class GANav {
    constructor(nav) {
        this.nav = nav;

        // Modify to attempt to dynamically create the svg.
        // Dynamically creating the svg does not lead to the desired effect.
        // It is added to the DOM (innerHTML is supposed to now work on SVG)
        // but does not appear to be activated.
        const svg = document.createElement('svg');
        svg.setAttribute('height', 1);
        svg.setAttribute('width', 1);
        svg.style.position = 'absolute';
        svg.style.top = '-1px';
        svg.style.left = '-1px';
        svg.innerHTML = '<defs><radialGradient id="GAgradient1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"> <stop offset="0%" stop-color="rgba(255, 255, 255, 1.0)"/><stop offset="25%"  stop-color="rgba(255, 255, 255, 1.0)"/><stop offset="100%" stop-color="rgba(255, 255, 255, 0.4)"/></radialGradient></defs>';
//        document.body.appendChild(svg);

        this.gaVars = {
            baseHeight: 3.0,
            flattener: 0.8,
            degDown: 1.0,
            pathWidth: 20,
            markerBaseFill: 'rgba(255, 255, 255, 0.4)'
        };
        
        this.closest = {
            id : -1,
              poly      :'',
              overMarker: 0
        };

        this.iClosest = -1;
        this.markerSearch = [];
        this.data = [];



        this.nav.viewer.markersPlugin.on('select-marker', (e, marker, data) => {
            const pos = {
                x: e.offsetX,
                y: e.offsetY
            };

            let imageNew = this.iClosest;
            if(imageNew < 0) {
                const b = this.nav.viewer.psv.getPosition();
                imageNew =  this.findClosest(
                    b.latitude,
                    b.longitude,
                    'select-marker'
                );
                if(imageNew >= 0) {
                    //TODO goTo(imageNew);
                    alert(`Going to ${imageNew} - TODO!`);
                }
            }
        });

        this.nav.viewer.markersPlugin.on('over-marker', (e, marker) => {
              this.closest.overMarker = 1; 
              this.markerOver(marker.id);
        });

        // on 'leave marker' undo highlight of that marker
        this.nav.viewer.markersPlugin.on('leave-marker', (e, marker) => {
              this.closest.overMarker = 0; 
              this.markerLeave(marker.id);
        });

        this.nav.viewer.markersPlugin.on('mousemove', this.onMouseMove.bind(this));
    }

    // Original code by Eesger Toering ;  modified to fit in
    // with the navigator code
    createPaths(id) {
        this.markerSearch = [];
        this.nav.viewer.markersPlugin.clearMarkers();
        let polyPath = [ 0, [] ];
        let i, b;
        for(i=0; i<this.nav.panoMetadata[id].sequence.panos.length; i++) {
            if(this.nav.panoMetadata[id].sequence.panos.length == 1) continue;
            const pano = this.nav.panoMetadata[id].sequence.panos[i];
            const latDelta = Math.abs(this.nav.panoMetadata[id].lat - pano.lat);
            if(latDelta * 111 * 1000 > 200) {
                polyPath = [polyPath[0] + 1, [] ];
                continue;
            }
            // skip lon next..
            const lonDelta = Math.abs(this.nav.panoMetadata[id].lon - pano.lon);
            if(lonDelta * Math.pow(290-(105+pano.lon), 1.065) * 1000 > 200) {
                polyPath = [polyPath[0] + 1, [] ];
                continue;
            }
            // reposition the spot directly below.. a minimum distance is 
            // needed because directly below (-.5*PI) there is no impact of yaw!
            if(id == pano.panoid) {
                const theOtherOne = (i==0) ? 
                    this.nav.panoMetadata[id].sequence.panos[1] : 
                    this.nav.panoMetadata[id].sequence.panos[i-1] ; 
                let distance1 = this.haversineDist(
                    this.nav.panoMetadata[id].lon,
                    this.nav.panoMetadata[id].lat,
                    theOtherOne.lon,
                    theOtherOne.lat
                );
                // Half 1/distance
                const distance2 = (distance1 < 0.7) ? 0.9 : 0.5/distance1;
                distance1 = 1 - distance2;

                b = coordtrans.geodeticToEnu(
                    theOtherOne.lat * distance2 + pano.lat * distance1,
                    theOtherOne.lon * distance2 + pano.lon * distance1,
                    0,
                    this.nav.panoMetadata[id].lat,
                    this.nav.panoMetadata[id].lon,
                    this.gaVars.baseHeight * 0.9
                );
            } else {
                b = coordtrans.geodeticToEnu(
                    pano.lat,
                    pano.lon,
                    pano.ele * this.gaVars.flattener,
                    this.nav.panoMetadata[id].lat,
                    this.nav.panoMetadata[id].lon,
                    this.nav.panoMetadata[id].ele * this.gaVars.flattener + this.gaVars.baseHeight
                );
            }    
            // into the ground by X degrees
            b[3] = Math.sqrt(b[0]*b[0] + b[1]*b[1]);
            b[2] -= Math.sin ( this.gaVars.degDown * Math.PI/180) * b[3];
               // b[3] = distance | b[4] = radians Pitch (-.5pi - 0.5pi)
            // b[5] = radians Yaw (0 - 2pi)
            b = coordtrans.enuPlusMarkerdata(b, 
                    -this.nav.panoMetadata[id].poseheadingdegrees);

            // b[6] = marker scale (result formula is via trial and error ;)
            b[6] =  (300/(b[3]>300 ? 300:b[3]))*(4/100)+0.03;

            // store the data for later usage (faster!!)
            this.data[i] = b;

              // create polyline to show the path of the images!
            if ( i <  this.nav.imageNow || (i == this.nav.imageNow && i != 0) ) {
                  polyPath[1].push([b[5]-b[6]/this.gaVars.pathWidth,
                        b[4],
                      ]);
                  polyPath[1].unshift([Math.round((b[5]+b[6]/this.gaVars.pathWidth)*1000)/1000, b[4], ]);
            } else {
                  polyPath[1].push([Math.round((b[5]+b[6]/this.gaVars.pathWidth)*1000)/1000,
                        b[4],
                       ]);
                  polyPath[1].unshift([b[5]-b[6]/this.gaVars.pathWidth,
                           b[4],
                          ]);
            }
            // in an earlier version the path was created for every 100 images 
            //or when the distance was over 100 meters
            // now it is only a polyline of one image to the next, 
            // so that a circle gradient can be placed on the mouse over, 
            // for a cooler effect ;)
            //if (b[3] > 100) {
            if(true) {
                  if (polyPath[1].length > 2 ) {
                    this.nav.viewer.markersPlugin.addMarker({
                          id  : 'polygon'+i, // now the polyline number is the same as the image number (for catching which one to highlite..)
//          content   : 'This mountain is so great it has dots on it!',
                          polylineRad: polyPath[1],
                          svgStyle  : {
                            fill : this.gaVars.markerBaseFill, 
                            stroke  : this.gaVars.markerBaseFill.replace(/([0-9.]+)\)/, function (x,y) { return parseFloat(y)/4+')'; }), // draw a line around the poly, because the don't connect perfectly..
                            strokeWidth: '1px',//'0.1em',
                          },
                    });

                    polyPath= [polyPath[0]+1,
                   [polyPath[1][ 0 ],
                    polyPath[1][ polyPath[1].length-1 ]]
                  ];
                  }
            } else {
                  polyPath= [polyPath[0]+1,
                 []
                ];
            }
            this.markerSearch[i] = [ b[4], b[5], i ];
        }

         // always draw the last polyline.. you might end up not to in the for loop
          if (polyPath[1].length > 1 ) {
            this.nav.viewer.markersPlugin.addMarker({
                  id        : 'polygon'+i,//polyPath[0],
                  //content   : 'This mountain is so great it has dots on it!',
                  polylineRad: polyPath[1],
                  svgStyle  : {
                    fill       : this.gaVars.markerBaseFill, 
                    stroke     : this.gaVars.markerBaseFill.replace(/([0-9.]+)\)/, function (x,y) {
                       return parseFloat(y)/4+')';
                     }),
                strokeWidth: '1px',//'0.1em',
                  },
            });
            polyPath= [[],[]];
            this.markerSearch[i] = [ b[4], b[5], i ];
        }
    }

    markerOver(markerID) {
          if (this.closest.poly.length && this.closest.poly != markerID) {
            this.markerLeave(this.closest.poly);
            this.closest.poly = ''; 
          } else {
            this.closest.poly = markerID; 
          }
          if (!this.nav.viewer.markersPlugin.markers[ markerID ]
               ||  this.nav.viewer.markersPlugin.markers[ markerID ].type == 'image'
               || !this.nav.viewer.markersPlugin.markers[ markerID ].config.svgStyle
               || !this.nav.viewer.markersPlugin.markers[ markerID ].config.svgStyle.fill) { 
            return; 
        }

          if ((typeof(this.gaVars.markerBaseFill) == 'undefined')) {
            this.gaVars.markerBaseFill = this.nav.viewer.markersPlugin.markers[ markerID ].config.svgStyle.fill;
          }
          let fillNew = 'url(#GAgradient1)';

  
          this.nav.viewer.markersPlugin.updateMarker({
            id   : markerID,
            svgStyle : {
                  fill       : fillNew,//'rgba(77, 239, 71, 0.6)',
                  stroke     : this.gaVars.markerBaseFill.replace(/([0-9.]+)\)/, function (x,y) {
                     return parseFloat(y)/4+')';
                   }),
              strokeWidth: '1px',//'0.1em',
            },
          });
    }

    markerLeave(markerID) {  //console.log('leave', marker.id);
          if (!this.nav.viewer.markersPlugin.markers[ markerID ]
               ||  this.nav.viewer.markersPlugin.markers[ markerID ].type == 'image'
               || !this.nav.viewer.markersPlugin.markers[ markerID ].config.svgStyle
               || !this.nav.viewer.markersPlugin.markers[ markerID ].config.svgStyle.fill) { 
            return; 
        }
  
          let fillNew = this.gaVars.markerBaseFill;


          this.nav.viewer.markersPlugin.updateMarker({
            id   : markerID,
            svgStyle : {
                  fill       : fillNew,
            },
          });
    }


    findClosest(lat,lon,extra_cmd) {
          var distMin = 99999;
          var distId  = -1;
          var lon2 = '';
          for (let i in this.markerSearch) {
            var latDelta = (lat - this.markerSearch[i][0]);
            var lonDelta = (lon - this.markerSearch[i][1])/3.5; // snapping to positions in the horizontal plane is way more important!!
            // distance ONLY in the horizontal plane!!
            var dist = Math.sqrt(latDelta*latDelta + lonDelta*lonDelta);
            if (distMin > dist ) {
                  distMin = dist;
                  distId = i;
            }
            lon2 = lon-Math.PI*2;
            lonDelta = (this.markerSearch[i][1]-lon2)/5;
            dist = Math.sqrt(latDelta*latDelta + lonDelta*lonDelta);
            if (distMin > dist ) {
                  distMin = dist;
                  distId = i;
            }
            lonDelta = (this.markerSearch[i][1]+lon2)/7;
            dist = Math.sqrt(latDelta*latDelta + lonDelta*lonDelta);
            if (distMin > dist ) {
                  distMin = dist;
                  distId = i;
            }

          }
  
          var distMax = Math.abs(lat)*(2/3);
  
          if (distMin > distMax) {
            distId = -1;
          } else {
  
            if (!this.closest.overMarker
                 && this.closest.poly != 'polygon'
                +this.markerSearch[distId][2]) {
                  if (this.closest.poly.length > 0) {
                    this.markerLeave(this.closest.poly);
                  }
                  this.closest.poly = '';
                  if (distId >= 0) {
                    this.markerOver('polygon'+this.markerSearch[distId][2]);
                  } 
            }
        }
        return distId;
    }
    
    onMouseMove(e) {
         const pos = { x: e.offsetX, y: e.offsetY };
          //GeoArchive.pos = pos;

         const vector = this.nav.viewer.psv.dataHelper.viewerCoordsToVector3(pos);
 
         if (vector && this.nav.curPanoId > 0) {
            const sphericalCoords = this.nav.viewer.psv.dataHelper.vector3ToSphericalCoords(vector);
            const textureCoords   = this.nav.viewer.psv.dataHelper.sphericalCoordsToTextureCoords(sphericalCoords);

            var b = coordtrans.enuToGeodetic(
                          sphericalCoords.latitude,
                          sphericalCoords.longitude,
                          this.gaVars.baseHeight/2,
                          this.nav.panoMetadata[this.nav.curPanoId].lat,
                          this.nav.panoMetadata[this.nav.curPanoId].lon,
                          this.gaVars.baseHeight);

            var iClosest = this.findClosest(sphericalCoords.latitude,
                               sphericalCoords.longitude,'mousemove');
            if (this.nav.viewer.markersPlugin.markers["Closest"]) {
                  this.nav.viewer.markersPlugin.removeMarker('Closest');
            }
            if (iClosest>=0) {
                  this.iClosest = iClosest;
                  b = this.data[iClosest];
            }
        } 
    }

    haversineDist  (lon1, lat1, lon2, lat2)    { 
        var R = 6371000;
        var dlon=(lon2-lon1)*(Math.PI / 180);
        var dlat=(lat2-lat1)*(Math.PI / 180);
        var slat=Math.sin(dlat/2);
        var slon=Math.sin(dlon/2);
        var a = slat*slat + Math.cos(lat1*(Math.PI/180))*Math.cos(lat2*(Math.PI/180))*slon*slon;
        var c = 2 *Math.asin(Math.min(1,Math.sqrt(a)));
        return R*c;
    }

//PSV.container.offsetHeight
  
}

module.exports = GANav;
