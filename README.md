
# Static Site Generator for Sitecore JSS
A static site generator for Sitecore JSS applications. Read more and find information on getting started [here](https://www.adamlamarre.com/static-site-generator-for-sitecore-jss/).

# Requirements
* Sitecore JSS React 11.02 or higher.

# Getting Started
* `npm install jss-static-site-generator --save-dev`
* Copy `bootstrap-static.js` and `build-static.js` from [here](https://github.com/erzr/jss-static-site-generator/tree/master/scripts).
* Edit `sitecoreApiHost` in `bootstrap-static.js`, change to the domain where your generated site will be hosted.
* Add the following commands to your JSS project `package.json`
```
"bootstrap:static:disconnected": "node scripts/bootstrap-static.js --disconnected",
"bootstrap:static:connected": "node scripts/bootstrap-static.js",
"build:static": "npm-run-all --serial bootstrap:static:disconnected build:client build:server --parallel generate:static",
"build:static:connected": "npm-run-all --serial bootstrap:static:connected build:client build:server --parallel generate:static",
"run:static": "npm-run-all --parallel generate:static",
"generate:static": "node ./scripts/build-static.js"
```
* Run `build:static` or `build:static:connected` depending on where you want data sourced from.

# Resources
* [https://www.adamlamarre.com/static-site-generator-for-sitecore-jss/](https://www.adamlamarre.com/static-site-generator-for-sitecore-jss/)
* https://www.adamlamarre.com/static-site-generator-for-sitecore-jss-typescript-and-npm-package/
* [https://www.npmjs.com/package/jss-static-site-generator](https://www.npmjs.com/package/jss-static-site-generator)
* [https://jss.sitecore.com/](https://jss.sitecore.com/)