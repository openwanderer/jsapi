import '../jquery/dist/jquery.min.js'

/*
 * This code is Eesger Toering's transitions code, adapted to "plug in" to the
 * rest of the OpenWanderer jsapi.
 *
 * Note that currently, the marker transition features are disabled, pending
 * integration.
 *
 * License: Lesser GNU General Public License v3.
 */

/* *********************************************************************************** */
/*             Geo 2 ENU in PSV code and the "cool zoom animation" created by:         */
/*                    Eesger Toering / knoop.frl / Project GEO Archive                 */
/*   Like the work? You'll be surprised how much time goes into a things like these..  */
/*                    be my hero, donate a few euro's for my work:                     */
/*                             https://donate.geoarchief.nl                            */
/* *********************************************************************************** */

const Transition  = {
    markerBaseFill: 'rgba(255, 255, 0, 0.4)',
    imageDelay: {
         time    : 1500, // transition time (it is in two parts, thus total transition is twice as long)
          timeMin : 1500, // transition time (it is in two parts, thus total transition is twice as long)
          count   : 0,    // counter for time calculation based upon image loading time (0-9)
          timer   : 0,    // for loading time calculation
          ease    : 1
    }, // manipulate animation factor | 1 = default/safe, higher=slower, lower=faster (below 0.5 will guarantee flickering / 0=error!)


    // dynamically add the required CSS (from Eesger) to the page
    init: function() {

        const style = document.createElement("style");
        style.setAttribute("type", "text/css");

        const css = [ /* for animated zoom transition */
            ".GATransition,",
            ".GATransitionCanvas,",
            ".GATransitionMarkers {",
              "position:absolute;",
              "top:0;",
              "left:0;",
              "width:100%;",
              "height:100%;",
              "z-index: 11;",
            "}",
            ".GATransition {",
              "transform: scale(1);",
            "}",
            ".GATransitionCanvas {",
              "background-size: 100%;",
            "}",
            /* for fading out the borders on an animated "step back" */
            ".GAborderfade1 {",
              "-webkit-mask-image: linear-gradient(to right, transparent 0%,black 4%,black 96%, transparent 100%);",
              "mask-image:         linear-gradient(to right, transparent 0%,black 4%,black 96%, transparent 100%);",
            "}",
            ".GAborderfade2 {",
              "-webkit-mask-image: linear-gradient(to bottom, transparent 0%,black 4%,black 96%, transparent 100%);",
              "mask-image:         linear-gradient(to bottom, transparent 0%,black 4%,black 96%, transparent 100%);"
            ].join("\n");
        style.appendChild(document.createTextNode(css));
        document.querySelector("head").appendChild(style);    
   },

    // go to a given panorama making use of transitions
    // nav - an OpenWanderer.Navigator object (used to look up metadata etc)
    // imageNew - ID of image to navigate to
    goTo: function (nav, imageNew) {
        return new Promise ( (resolve, reject) => {
            this.resolve = resolve;
            this.psv = nav.viewer.psv;
            const metadata = nav.panoMetadata[imageNew];
            if (!metadata) {
                reject('Transition.goTo(): imageID '+imageNew+' does not exist!!');
                return;
            }
            if (this.goToActive) {
                reject('Transition.goTo(): busy!!');
                return;
            }
            this.goToActive = 1;
            let delayTime = new Date();

            this.imageDelay.timer = ((delayTime.getHours()*60+delayTime.getMinutes())*60+delayTime.getSeconds())*1000+delayTime.getMilliseconds();  
            this.container = this.psv.config.container;
            const spherical = nav.viewer._calcSphericalCoords ([[parseFloat(metadata.lon), parseFloat(metadata.lat), metadata.ele]]);
            const yawPitchDist = spherical.yawPitchDist[0];
            
            // get pixelpositions of the new location | lon/lat are relative 
            // from viewpoint (so they are not "world coordinates!") - aka 
            // pitch/yaw
            const sphericalCoords = {
                longitude: yawPitchDist[0], 
                latitude : yawPitchDist[1]     
            }; 
            // get x/y via spherical lon/lat
            let vector3 = this.psv.dataHelper.sphericalCoordsToVector3(sphericalCoords);
            let pos = this.psv.dataHelper.vector3ToViewerCoords(vector3);
            pos.iClosest = imageNew;
            // get horizon position
            pos.h = this.psv.dataHelper.vector3ToViewerCoords(
                                  this.psv.dataHelper.sphericalCoordsToVector3(
                                    {longitude: 0, latitude: 0}
                                  )
                                 ).y;
            if (pos.h < 0) { pos.h = 0; }
            if (pos.h > this.psv.container.offsetHeight) { 
                pos.h = this.psv.container.offsetHeight; 
            }

            // approximate zoom scaling via radial latitude 
            //( horizon = 0 straight down is PI/2 )
            let scale = 1.8*(Math.PI*0.5-Math.abs(sphericalCoords.latitude));
            if (scale <  1.1) { scale = 1.1; }
            if (scale > 10  ) { scale = 10; }
    
            // give the canvas an ID, easier for catching it later..
            $(this.container).find('.this.psv-canvas-container')
                .first()
                .find('canvas')
                .first()
                .attr('id','GA'+this.container.id+'Canvas');
    
            // remove previous transition, start with a clean slate
            if ($('#GA'+this.container.id+'Transition').length) {
                  $('#GA'+this.container.id+'Transition').remove();
            }
    
            // the thing sometimes seems to open..
            setTimeout(() => { $('.this.psv-panel-close-button').click(); },100);
    
            // build the containers for the animation
            //$('#'+container).find('.this.psv-container')    
               // build the containers for the animation
            $(this.container)
                .find('.psv-container')
                .first()
                .append('<div id="GA'+this.container.id+'Transition" class="GATransition" style="position:absolute;top:0;left:0;width:100%;height:100%;">'+
        '<img id="GA'+this.container.id+'TransitionCanvas"  class="GATransitionCanvas" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">'+
//    NW MARKERS COMMENTED OUT FOR NOW    '<img id="GA'+container.id+'TransitionMarkers" class="GATransitionCanvas" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">'+
                  '</div>');

            // copy source Canvas for animation
            // re-render image for grabbing (extremely important!!)
            this.psv.renderer.render(); 
            $('#GA'+this.container.id+'TransitionCanvas' )
                .css('background-image', 'url(' + 
                this.psv.renderer.renderer.domElement.toDataURL() + ')');

            // copy markers SVG (only!) for animation (and remove gradients)
            // NW MARKERS COMMENTED OUT FOR NOW  $('#GA'+container.id+'TransitionMarkers').attr('src', 'data:image/svg+xml;base64,'+ btoa($('#'+container.id).find('.psv-markers').first().html().replace(/^.*?<svg /, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+.psv.container.offsetWidth+' '+.psv.container.offsetHeight+'" ') .replace(/url\(\#GAgradient[0-9]\)/g, this.markerBaseFill) .replace(/\/svg>.*$/, '/svg>')));

            // create a separate thread for the first step of the animation
            setTimeout(this._animationFirstStage.bind(this, pos, scale), 100);
          
            // set the new pano with options
            // (in a timeout, otherwise the removing initiated above doesn't 
            // get done smoothly..)
            setTimeout(() => {
                this._doSetPano(nav.api.panoImg.replace('{id}', imageNew))
                    .then (resolve)
                }, 250);
       });
    },

    _animationFirstStage: function(pos, scale) {
        let animateLeft;

        let dirDelta = 0;
        if (this.psv.config.fisheye) {
            scale = 1;
        } else if (pos.y < 0 // go back!!
            || pos.y/this.psv.container.offsetHeight*5 < 
            pos.h/this.psv.container.offsetHeight 
            // one would exect only negative.. but not so..
               || pos.y > this.psv.container.offsetHeight*2 
            // one would exect only negative.. but not so..
        ) {
            scale = 0.95;
            animateLeft = (100-(scale*100))/2;
            $('#GA'+this.container.id+'Transition').addClass('GAborderfade1');
            $('#GA'+this.container.id+'TransitionCanvas').addClass('GAborderfade2');
            // NW MARKERS COMMENTED OUT FOR NOW                    $('#GA'+container.id+'TransitionMarkers').addClass('GAborderfade2');
        } else {
            // factor in difference in viewing direction 
            // (when available, work in progress, 
            // doesn't seem to add desired effect..)
            animateLeft = (-pos.x/this.psv.container.offsetWidth *100)*
                (scale-1)+dirDelta*scale/2;
            if (animateLeft > 0) { animateLeft = 0; }
            if ((scale*100) + animateLeft < 100) { 
                animateLeft = 100-(scale*100); 
            }
        } 

        // first I tried to use CSS transitions.. but the effect was 
        // not smooth. Cause proved to be the loading and rendering of 
        //the new pano animate position and zoom for optical effect 
        // moving to next image
        $('#GA'+this.container.id+'Transition').animate({
              'left'      : animateLeft+'%',
              'top'       : ((-pos.h/this.psv.container.offsetHeight*100)*(scale-1))+'%',
              'width'     : (scale*100)+'%',
              'height'    : (scale*100)+'%',
             },
            this.imageDelay.time*
            this.imageDelay.ease*0.5
        );
    },

    _doSetPano: function(url) {
        return new Promise ((resolve, reject) => {
            this.psv.setPanorama(url,
                { transition:false,
                    showLoader:false
            }).then(() => {
                  // use loading time of panorame for better timed animation
                let delayTime = new Date();
                let timer = ((delayTime.getHours()*60+delayTime.getMinutes())*60+delayTime.getSeconds())*1000+delayTime.getMilliseconds();
                // a minimum impact of 10% of the loading time
                this.imageDelay.count+= (this.imageDelay.count < 9) ? 1 : 0;
                if (this.imageDelay.count == 1) {
                    this.imageDelay.time = timer - this.imageDelay.timer;
                } else {
                    this.imageDelay.time = (this.imageDelay.time*this.imageDelay.count + (timer - this.imageDelay.timer))/(this.imageDelay.count+1);
                }
                // a minimum time of one second
                if (this.imageDelay.time<this.imageDelay.timeMin) { 
                    this.imageDelay.time = this.imageDelay.timeMin; 
                }

                // store current position
                // NW not needed as handled by Navigator
                //this.imageNow = parseInt(imageNew);

                // some extra time before loading the (new corrected) markers again after the transition
                // (otherwise the markers tend to "jump around")
                let markertimer = this.imageDelay.time*(2/3);
                if (markertimer < 700) { markertimer = 700; }
                // NW MARKERS COMMENTED OUT FOR NOW                  setTimeout(() => { loadMarkers(); },markertimer);

                // second stage of the animation
                console.log('Second stage of animation...');
                if ($('#GA'+this.container.id+'Transition').length) {
                // in a seperate thread (otherwise the markers flicker)
                    setTimeout(() => {
                        this._animationSecondStage().then(resolve);
                    }, this.imageDelay.time * this.imageDelay.ease * 0.1);
                } else {
                    console.log('No transition');
                    // allow next transition 
                    this.goToActive = 0;
                    resolve();
                }
            });
        });
    },

    _animationSecondStage: function() {
        return new Promise((resolve, reject) => {
            // fade out to next image done on the containing images, 
            // NOT the container, less smoth (conflict with first animation..?)
            $('#GA'+this.container.id+'Transition img').animate({
                   'opacity'   : '0'
                },
                this.imageDelay.time * this.imageDelay.ease*1.5,
                () =>  {
                    // allow next transition 
                    this.goToActive = 0;
                    // hide transition to the back (not destroid to prevent conflicts in the various timeouts)
                    $('#GA'+this.container.id+'Transition')
                    .css({ 'z-index'   : '-1' });
                    resolve();
                }
            );
        });    
    }
};

export default Transition;
