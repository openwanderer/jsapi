# OpenWanderer JavaScript API Examples

This directory contains a series of examples of using the OpenWanderer JavaScript API. This document walks you through the examples.

## Example 1 : A basic viewer application

[Example 1](ex1.html) is a very simple application showing the use of `OpenWanderer.Viewer`. This class is the most basic class within the API and allows you to create a panorama viewer, set its location within the world (in WGS84 latitude/longitude and elevation in metres), and add markers (again using WGS84 lat/lon and elevation in metres). `OpenWanderer.Viewer` is essentially a thin wrapper around `PhotoSphereViewer.Viewer` from [Photo Sphere Viewer](https://photo-sphere-viewer.js.org), allowing you to position panoramas and add markers using 'world' (WGS84) latitudes and longitudes.

So on to the code. First we need to import the `OpenWanderer` module:
```
import OpenWanderer from '../index.js'
```
As the example is part of the `jsapi` repository, we are using a relative
link here, but if using from your own project, you will want to install
the API using npm:
```
npm install openwanderer-jsapi
```
and then import it from your `node_modules`:
```
import OpenWanderer from './node_modules/openwanderer-jsapi/index.js`;
```
Next we create an `OpenWanderer.Viewer` object, specifying a CSS selector
identifying the page element hosting the panorama:
```
const viewer = new OpenWanderer.Viewer('#pano');
```
We can then position the panorama at a given real-world location (longitude,
latitude and elevation). This one is near Butser Hill in the South Downs
National Park of southern England.
```
viewer.setLonLat(-0.9807, 50.966275);
viewer.setElevation(126);
```
We then specify the heading (yaw, azimuth, bearing) of the panorama. This is necessary to align the panorama correctly so that markers are at the correct position.  You need to use a heading in the range -180 -> 0 -> 180. Our example panorama has a heading of 3 degrees. In a server-based application, the server could
send the heading back to the client and do this step automatically, but for
now, we will do it manually.
```
viewer.setRotation(3);
```
We next set the actual panorama file. This is a thin wrapper around the 
equivalent method in Photo Sphere Viewer, and returns a promise which resolves
as soon as the pano has been loaded.
```
viewer.setPanorama('images/1200.jpg').then( () => {
    viewer.addMarker([-0.9807, 50.9669, 129]);
    viewer.addMarker([-0.9807, 50.9674, 134]);
});
```
In the resolve function, we add markers to the viewer. Note how we specify
an array containing, in order, WGS84 latitude, WGS84 longitude, and elevation
in metres for the current marker.

We can set custom properties (which again get sent straight through to
Photo Sphere Viewer) by specifying an options object as the second argument to
`addMarker()`, for example:
```
viewer.addMarker([-0.9807, 50.9780, 270], {
    fill: 'rgba(255, 0, 0, 0.5)',
    stroke: 'rgba(255, 0, 0, 1.0)',
    tooltip: 'Butser Hill Summit 270m'
});
```
This example will use custom colours for the marker and add a tooltip which
appears when the user rolls over the marker.

Finally, we can add a path (a polyline comprising multiple points) to the 
panorama with the `addPath()` method, which takes an array of three-member arrays, each containing lon/lat/elevation points, making up the path:
```
viewer.addPath([
        [-0.9807, 50.966275, 124.5],
        [-0.9807, 50.9669, 129],
        [-0.9807, 50.9674, 134],
        [-0.9808, 50.9680, 142],
        [-0.9810, 50.9686, 149],
        [-0.9812, 50.9692, 157],
        [-0.9813, 50.9697, 165],
        [-0.9815, 50.9701, 173],
        [-0.9817, 50.9705, 181]
    ], {
        tooltip: "Route to Butser Hill"
    });
```

## Example 2 : A basic navigator appliction

Example 2 shows the basic use of the `OpenWanderer.Navigator` class, which allows you to navigate along a panorama sequence.

As for the first example, we need to import `OpenWanderer`; again, in your own application, you will probably want to do this with npm.

We then create an `OpenWanderer.Navigator` object, again specifying the element
hosting the panorama.
```
const navigator = new OpenWandeerer.Navigator({
    element: '#pano',
    ....
});
```
We then need to specify the `sequence` that we want to show. This property
can be set to a function to load a sequence from an API, but that is for a
later example. In this simple example of `OpenWanderer.Navigator`, we
are going to use a simple hard-coded sequence, containing an array of pano
objects. Each pano object should have the following properties:
- `panoid` : A unique ID for this panorama.
- `image` : the panorama image.
- `lon` : the panorama's longitude.
- `lat` : the panorama's latitude.
- `ele` : the panorama's elevation, in metres:
- `tilt` : the panorama's tilt (pitch) angle;
- `roll` : the panorama's roll angle;
- `pan` : the panorama's pan (yaw, azimuth, bearing) angle.

So here is a full example:
```
const navigator = new OpenWanderer.Navigator({
    element: '#pano',    
    sequence: 
         [{
              "panoid":1,
              "image": 'images/8.jpg',
              "lon":"-1.4116138888889",
              "lat":"50.9347",
              "ele":58,
              "tilt":-10,
              "roll":0,
              "pan":-178
            },{ 
              "panoid":2,
              "image": 'images/10.jpg',
              "lon":"-1.4115071296692",
              "lat":"50.934328480366",
              "ele":56,
              "tilt":-20,
              "roll":0,
              "pan":175
            },{
              "panoid":3,
              "image": 'images/11.jpg',
              "lon":"-1.4114320278168",
              "lat":"50.933888985495",
              "ele":55,
              "tilt":-5,
              "roll":0,
              "pan":170
            },{
              "panoid":4,
               "image": 'images/12.jpg',
               "lon":"-1.4115822441333",
               "lat":"50.9334292018",
               "ele":53,
               "tilt":-10,
               "roll":0,
               "pan":-145
        }]
})
``` 
Once we've done that, we simply load a given panorama using its ID. This
will load the panorama with the ID 1 (the first in the array):
```
navigator.loadPanorama(1);
```
This will show the panorama, and also show you the sequence as a navigable polyline route. The other panoramas in the sequence are shown as clickable markers;
you can navigate to another panorama by clicking on it.

### A word about pan, tilt and roll

At the moment, the pan (heading) angle (as well as tilt and roll in the
second example) have to be manually specified. Photo Sphere Viewer v4.2 adds
functionality to automatically read these angles from XMP data from the
panorama file. However a number of changes will need to be made to 
the OpenWanderer jsapi to work with v4.2, so this does not work just yet.
Work is ongoing to update the relevant code; see the v4.2 branch.

## Further examples

Further meaningful examples need a server to run. Please see the (example apps)[https://github.com/openwanderer/example-app] repo for examples of varying complexity.
