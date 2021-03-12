/*
 *
 * Example 1
 * 
 * Simple usage of OpenWanderer.Viewer.
 *
 */ 

const viewer = new OpenWanderer.Viewer('#pano');

// Specify our current lon/lat.
viewer.setLonLat(-0.9807, 50.966275);

// Specify our current elevation (metres)
viewer.setElevation(126);

// Specify the rotation correction. Sometimes XMP data is inaccurate; this
// API call allows you to correct the pan (heading).
// You can also correct the tilt and roll if you supply a component of 'tilt' 
// or 'roll' as the second argument.
// The panorama rotates clockwise relative to markers as you increase 0->360.
viewer.setRotationCorrection(3);

// Load the panorama, then add markers.
viewer.setPanorama('images/1200.jpg').then ( () => {
    viewer.addMarker([-0.9807, 50.9669, 129]);
    viewer.addMarker([-0.9807, 50.9674, 134]);
    viewer.addMarker([-0.9808, 50.9680, 142]);
    viewer.addMarker([-0.9810, 50.9686, 149]);
    viewer.addMarker([-0.9812, 50.9692, 157]);
    viewer.addMarker([-0.9813, 50.9697, 165]);
    viewer.addMarker([-0.9815, 50.9701, 173]);
    viewer.addMarker([-0.9817, 50.9705, 181]);
    viewer.addMarker([-0.9818, 50.9710, 190]);
    viewer.addMarker([-0.9807, 50.9780, 270], { 
        scale: 5,
        fill: 'rgba(255, 0, 0, 0.5)',
        stroke: 'rgba(255, 0, 0, 1.0)',
        tooltip: 'Butser Hill summit 270m'
    });
    viewer.addMarker([-0.9820, 50.9768, 269], { 
        scale: 5,
        fill: 'rgba(0, 0, 255, 0.5)',
        stroke: 'rgba(0, 0, 255, 1.0)',
        tooltip: 'Butser Hill mast'
    });
    viewer.addMarker([-0.9669, 50.9738, 244], { 
        scale: 5,
        fill: 'rgba(255, 0, 0, 0.5)',
        stroke: 'rgba(255, 0, 0, 1.0)',
        tooltip: 'War Down 244m'
    });

    // add a path
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
});
