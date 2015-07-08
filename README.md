# OnFire
OnFire is a library that makes it easier to develop and maintain Firebase apps that have complex
data structures.  
Here are [more details](https://github.com/isabo/onfire/wiki/OnFire-Goals-&-Requirements).

## How to use OnFire in your project
### Browser based projects
* Optional: `bower install [--save] isabo/onfire`
* Load `onfire.min.js` into your project, after the line that references Firebase. For example:  
  `<script src="./bower_components/onfire/dist/onfire.min.js"></script>`

### Node.js based projects
* `npm install [--save] isabo/onfire`
* `var Ref = require('onfire').Ref`

## How to set up the development environment
This is not needed if you just want to use OnFire in your project.

### Pre-requisites
* Java - used by Google Closure Compiler to optimise and minify Javascript.
* NPM - used to manage dependencies. This is usually installed together with
  [Node.js](https://nodejs.org/).

### Dependencies
* Install: `npm install`
* Refresh: `npm update`
