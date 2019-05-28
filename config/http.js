/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * (for additional recommended settings, see `config/env/production.js`)
 *
 * For more information on configuration, check out:
 * https://sailsjs.com/config/http
 */

module.exports.http = {

  /****************************************************************************
  *                                                                           *
  * Sails/Express middleware to run for every HTTP request.                   *
  * (Only applies to HTTP requests -- not virtual WebSocket requests.)        *
  *                                                                           *
  * https://sailsjs.com/documentation/concepts/middleware                     *
  *                                                                           *
  ****************************************************************************/

  middleware: {

    /***************************************************************************
    *                                                                          *
    * The order in which middleware should be run for HTTP requests.           *
    * (This Sails app's routes are handled by the "router" middleware below.)  *
    *                                                                          *
    ***************************************************************************/

    // order: [
    //   'cookieParser',
    //   'session',
    //   'bodyParser',
    //   'compress',
    //   'poweredBy',
    //   'router',
    //   'www',
    //   'favicon',
    // ],


    /***************************************************************************
    *                                                                          *
    * The body parser that will handle incoming multipart HTTP requests.       *
    *                                                                          *
    * https://sailsjs.com/config/http#?customizing-the-body-parser             *
    *                                                                          *
    ***************************************************************************/

    // bodyParser: (function _configureBodyParser() {
    //   var skipper = require('skipper');
    //   var middlewareFn = skipper({ strict: true, maxTimeToBuffer: 100000, });
    //   return middlewareFn;
    // })(),

    bodyParser: (function (opts) {
      var xml2jsDefaults = {
        explicitArray: false,
        normalize: false,
        normalizeTags: false,
        trim: true
      };
      // Get an XML parser instance
      var xmlParser = require('express-xml-bodyparser')(xml2jsDefaults);
      // Get a Skipper instance (handles URLencoded, JSON-encoded and multipart)
      var skipper = require('skipper')({ strict: true, maxTimeToBuffer: 100000, });
      // Return a custom middleware function
      return function (req, res, next) {
        
        // If it looks like XML, parse it as XML
        if(req.headers.isDefined('content-type') === true){
          if (req.headers && (req.headers['content-type'].includes('text/xml') || req.headers['content-type'].includes('application/xml'))) {
            return xmlParser(req, res, next);
          }
        }
        // Otherwise let Skipper handle it
        return skipper(req, res, next);
      };

    })()
  }

}
