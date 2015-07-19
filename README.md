# OnFire
OnFire is a general purpose library for use in browsers and on Node.js servers, that makes it easier
to develop and maintain Firebase apps that have complex data structures.

Already implemented:
* Schema-driven, always up-to-date models. Where appropriate, property values are also models.
* Promises instead of callbacks where relevant.

Coming soon:
* Loose coupling between locally triggered "chain-reaction" operations, allowing more
  compartmentalization and less spaghetti code.
* Persistence!

Here are [more details](https://github.com/isabo/onfire/wiki/OnFire-Goals-&-Requirements).

## Examples
Schema-driven modules prevent unintentional errors later on.
```js
var Person = onfire.defineModel(
    {
        firstName: 'string',
        lastName: 'string',
        jobs: {
            $id: {
                title: 'string',
                company: 'string',
                startYear: 'number',
                endYear: 'number'
            }
        }
    });

var person = new Person(ref);
person.whenLoaded().
    then(function(person) {
        // Do something with the person.
    });

// A getter/setter is generated for each property.
console.log(person.firstName());

// The jobs property is automatically instantiated as a collection model.
console.log(person.jobs().count())

// The setters are chainable.
person.firstName('Fred').lastName('Bloggs');
person.save().then(...); // a promise.

// This will throw an exception, because of the mis-spelt property name.
person.frtisName('John');

// Collections can be conveniently manipulated.
person.jobs().fetch('abc-123-def').
    then(function(job) {
        // job is a model. It is already loaded, i.e. no need to call .whenLoaded().
    });

// Add a new member to a collection.
person.jobs().create(
    {
        title: 'VP Sales',
        company: 'Claritude Software Ltd.',
        startYear: 2014
    }).
    then(function(job){
        // job is a model.
        // A key was automatically generated for it.
        // It is already loaded.
        console.log(job.key());
    });


// When a member's ID is predetermined, fetchOrCreate() will fetch it if it already exists, and
// create it if it doesn't. This is, of course, performed transactionally.
person.jobs().fetchOrCreate('zyx-321-cba',
    {
        title: 'Team Leader',
        company: 'ABC & Co. Ltd.',
        startYear: 2013,
        endYear: 2014
    }).
    then(function(job) {
        // job now exists in the database.
    });
```

## How to use OnFire in your project
### Browser based projects
* Load `onfire.min.js` into your project, after the line that references Firebase. For example:  
  `<script src="./bower_components/onfire/dist/onfire.min.js"></script>`
* Optional: `bower install --save isabo/onfire`

### Node.js based projects
* `npm install --save onfire`
* `var onfire = require('onfire');`

## How to set up the development environment
This is not needed if you just want to use OnFire in your project.

### Pre-requisites
* Java - used by Google Closure Compiler to optimise and minify Javascript.
* NPM - used to manage dependencies. This is usually installed together with
  [Node.js](https://nodejs.org/).

### Dependencies
* Install the dependencies locally: `npm install`
* Update the dependencies to the most recent compatible versions: `npm update`

### How To Run the Test Suite
`npm test`

### How to Build the Distributables
`./build/compile.sh`
