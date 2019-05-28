/**
 * Staging environment settings
 * (sails.config.*)
 *
 * This is mostly a carbon copy of the production environment settings
 * in config/env/production.js, but with the overrides listed below.
 * For more detailed information and links about what these settings do
 * see the production config file.
 *
 * > This file takes effect when `sails.config.environment` is "staging".
 * > But note that NODE_ENV should still be "production" when lifting
 * > your app in the staging environment.  In other words:
 * > ```
 * >     NODE_ENV=development sails_environment=staging node app
 * > ```
 *
 * If you're unsure or want advice, stop by:
 * https://sailsjs.com/support
 */

//var PRODUCTION_CONFIG = require('./production');
//--------------------------------------------------------------------------
// /\  Start with your production config, even if it's just a guess for now,
// ||  then configure your staging environment afterwards.
//     (That way, all you need to do in this file is set overrides.)
//--------------------------------------------------------------------------

module.exports = Object.assign({}, {

 

  custom: Object.assign({},  {

    adminEmails: 'ron@seafoodsouq.com, milton@seafoodsouq.com, kharron@seafoodsouq.com',

    baseUrl: 'http://qaapi.seafoodsouq.com',
    webappUrl: 'https://qa.seafoodsouq.com',

    //--------------------------------------------------------------------------
    // /\  Hard-code the base URL where your staging environment is hosted.
    // ||  (or use system env var: `sails_custom__baseUrl`)
    //--------------------------------------------------------------------------

    internalEmailAddress: 'milton@seafoodsouq.com',
    //--------------------------------------------------------------------------
    // /\  Hard-code the email address that should receive support/contact form
    // ||  messages in staging (or use `sails_custom__internalEmailAddress`)
    //--------------------------------------------------------------------------

    // mailgunSecret: 'key-sandbox_fake_bd32301385130a0bafe030c',
    // stripeSecret: 'sk_sandbox__fake_Nfgh82401348jaDa3lkZ0d9Hm',
    // stripePublishableKey: 'pk_sandbox__fake_fKd3mZJs1mlYrzWt7JQtkcRb',
    //--------------------------------------------------------------------------
    // /\  Hard-code credentials to use in staging for other 3rd party APIs, etc.
    // ||  (or use system environment variables prefixed with "sails_custom__")
    //--------------------------------------------------------------------------

  })

});
