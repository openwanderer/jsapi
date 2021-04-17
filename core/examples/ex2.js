/*
 *
 * Example 2
 * 
 * Set up am OpenWanderer.Navigator object with a hard-coded pano sequence.
 *
 */ 

import * as OpenWanderer from 'openwanderer-jsapi';

const navigator = new OpenWanderer.Navigator({
    element: '#pano',    
    // The sequence is an array of objects with the properties for each
    // image. To work correctely, the first five properties must be provided.
    // 'pancorrection' is optional and should be provided
    // if the XMP heading (pan) angle within the panorama needs correcting. 
    sequence: 
         [{
              "panoid":1,
              "image": 'images/8.jpg',
              "lon":"-1.4116138888889",
              "lat":"50.9347",
              "ele":58,
              "pancorrection": 119
            },{ 
              "panoid":2,
              "image": 'images/10.jpg',
              "lon":"-1.4115071296692",
              "lat":"50.934328480366",
              "ele":56,
              "pancorrection": 155
            },{
              "panoid":3,
              "image": 'images/11.jpg',
              "lon":"-1.4114320278168",
              "lat":"50.933888985495",
              "ele":55,
              "pancorrection": 56
            },{
              "panoid":4,
               "image": 'images/12.jpg',
               "lon":"-1.4115822441333",
               "lat":"50.9334292018",
               "ele":53,
               "pancorrection": 30
        }]
});

// Move to a specific panorama by ID.
navigator.loadPanorama(1);
