import OpenWanderer from '../index.js';

/*
 *
 * Example 2
 * 
 * Set up am OpenWanderer.Navigator object with a hard-coded pano sequence.
 *
 */ 

const navigator = new OpenWanderer.Navigator({
    element: '#pano',    
    api: {
        panoImg: 'images/{id}.jpg', // path to images, {id} will be replaced by the pano ID in the sequence.
    },
    // The sequence is an array of objects with the properties for each
    // image. To work correctely, all these properties must be specified.
    sequence: 
         [{
              "panoid":8,
              "lon":"-1.4116138888889",
              "lat":"50.9347",
              "ele":58,
              "tilt":-10,
              "roll":0,
              "pan":-178
            },{ 
              "panoid":10,
              "lon":"-1.4115071296692",
              "lat":"50.934328480366",
              "ele":56,
              "tilt":-20,
              "roll":0,
              "pan":175
            },{
              "panoid":11,
              "lon":"-1.4114320278168",
              "lat":"50.933888985495",
              "ele":55,
              "tilt":-5,
              "roll":0,
              "pan":170
            },{
              "panoid":12,
               "lon":"-1.4115822441333",
               "lat":"50.9334292018",
               "ele":53,
               "tilt":-10,
               "roll":0,
               "pan":-145
        }]
});

// Move to a specific panorama by ID.
navigator.loadPanorama(8);
