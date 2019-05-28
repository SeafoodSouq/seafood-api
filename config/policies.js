/**
 * Policy Mappings
 * (sails.config.policies)
 *
 * Policies are simple functions which run **before** your actions.
 *
 * For more information on configuring policies, check out:
 * https://sailsjs.com/docs/concepts/policies
 */

module.exports.policies = {

  '*': 'is-logged-in',

  // Bypass the `is-logged-in` policy for:
  'user/verificationCode': true,

  // 'FishController': {
  //   getAllPagination: true,
  //   customWhere: true,
  //   search: true,
  //   getXMultipleID: true
  // },

  // FishTypeController: {
  //   getXNamePagination: true
  // },

  ImageController: {
    getImage: true,
    getImagesCategory: true,
    getImagesLicense: true,
    getImagePrimary: true,
    getLogoAndHeroStore: true,
    getImagesStore: true,
    getShippingFiles: true,
  },
  UserController: {
    emailExist: true,
    verificationCode: true,
    resetEmail: true,
    updatePassword: true,
    resetEmail: true,
    changePassword: true
  },
  StoreController: {
    save: true,
    update: true
  },
  ShoppingCartController: {
    sendPDF: true,
  },
  DocusignController: {
    resposeEnvelope: true
  },
  PaymentsController: {
    getAuthorization: true
  },
  /*  FeaturedProductsController: {
      "*": true
    },
    FeaturedSellerController: {
      "*": true
    },
    FeaturedTypesController: {
      "*": true,
    },
    FishTypeMenu: {
      "*": true
    },
  */
  'countries/find': true,
  'entrance/*': true,
  'account/logout': true,
  'view-homepage-or-redirect': true,
  'deliver-contact-form-message': true,
  '/api/login': true,

};
