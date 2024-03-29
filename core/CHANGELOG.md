Changelog
=========

## "Stable" versions (though still early in development)

- v0.3.0 (15/08/22) - Navigator shows simple arrows to link panoramas by default (as in OpenTrailView), for a cleaner UI. However pano markers and full sequence paths still available via the Navigator `panoMarkers` option when set to `true`. Also, fixed bug which caused error when sequence route clicked.

- v0.1.5 (08/11/21) - functionality to add arbitrary shapes (defined by ENU points) to the panorama. Can be used, for example, to add 3D navigation arrows.

- v0.1.4 (16/04/21) - functionality unchanged but no longer builds a bundle. If using 0.1.4 upwards, you should include into your project via npm, import as a module, and use a tool such as Webpack to build.

- v0.1.3 (23/03/21) - Eesger's SVG mouseover effects moved to `viewer.js` so that they can be used without a navigator. Also SVG mouseover colour can now be specified.

- v0.1.2 (21/03/21) - minor updates: turn off sequences if 'sequence' option is defined but false (or technically, anything other than an array or function). Also allow custom marker and path click handlers.
Bugfix when specifiying sequence as array.
Fix examples to link to correct version of openwanderer-jsapi.

- v0.1.1 (13/03/21) - fully working with PSV4.2.1 allowing inherent XMP data to be combined with sphere correction. Pan, tilt and roll are *corrections* to XMP data, NOT the raw values. Builds to bundle; use unpkg to include in a project.

## Early highly-unstable versions 

- v0.0.9 (09/03/21) - fully working with PSV4.2.1 allowing inherent XMP data to be combined with sphere correction. Pan, tilt and roll are *corrections* to XMP data, NOT the raw values.

- v0.0.8 (05/03/21) - adapt to work with PSV4.2  though useXmpData must be set to false; viewer.setPanorama() called back from transition module. 

- v0.0.7 (01/03/21) - remove the external sequence-provider.js and replace 
 with a default sequence provider.
 *
- v0.0.5 (27/02/21) - can specify 'image' property in pano JSON for sequences,
 allowing use of arbitrary images (filename does not need to match image ID)
 
- v0.0.4 (26/02/21) - sequence loading behavior changed, as described above.

- v0.0.3 (22/02/21) : add 'panoTransFunc' option to allow specification of * a panorama transition function (to allow transition effects, such as Eesger's transitions).
