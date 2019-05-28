/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes tell Sails what to do each time it receives a request.
 *
 * For more information on configuring custom routes, check out:
 * https://sailsjs.com/anatomy/config/routes-js
 */

module.exports.routes = {

  //  ╦ ╦╔═╗╔╗ ╔═╗╔═╗╔═╗╔═╗╔═╗
  //  ║║║║╣ ╠╩╗╠═╝╠═╣║ ╦║╣ ╚═╗
  //  ╚╩╝╚═╝╚═╝╩  ╩ ╩╚═╝╚═╝╚═╝
  //'GET /': { action: 'view-homepage-or-redirect' },
  'GET /welcome': { action: 'dashboard/view-welcome' },

  'GET /faq': { view: 'pages/faq' },
  'GET /legal/terms': { view: 'pages/legal/terms' },
  'GET /legal/privacy': { view: 'pages/legal/privacy' },
  'GET /contact': { view: 'pages/contact' },

  'GET /signup': { action: 'entrance/view-signup' },
  'GET /email/confirm': { action: 'entrance/confirm-email' },
  'GET /email/confirmed': { view: 'pages/entrance/confirmed-email' },

  'GET /login': { action: 'entrance/view-login' },
  'GET /password/forgot': { action: 'entrance/view-forgot-password' },
  'GET /password/new': { action: 'entrance/view-new-password' },

  'GET /account': { action: 'account/view-account-overview' },
  'GET /account/password': { action: 'account/view-edit-password' },
  'GET /account/profile': { action: 'account/view-edit-profile' },

  /******
   * 
   * Para mostrar una page mientras se confirma el correo
   * 
   */
  'GET /verification/:id/:code': { view: 'pages/entrance/confirming-email' },

  //  ╔═╗╔═╗╦  ╔═╗╔╗╔╔╦╗╔═╗╔═╗╦╔╗╔╔╦╗╔═╗
  //  ╠═╣╠═╝║  ║╣ ║║║ ║║╠═╝║ ║║║║║ ║ ╚═╗
  //  ╩ ╩╩  ╩  ╚═╝╝╚╝═╩╝╩  ╚═╝╩╝╚╝ ╩ ╚═╝
  // Note that, in this app, these API endpoints may be accessed using the `Cloud.*()` methods
  // from the CloudSDK library.
  '/api/logout': { action: 'account/logout' },
  'PUT   /api/v1/account/update-password': { action: 'account/update-password' },
  'PUT   /api/v1/account/update-profile': { action: 'account/update-profile' },
  'PUT   /api/v1/account/update-billing-card': { action: 'account/update-billing-card' },
  'PUT   /api/login': { action: 'entrance/login' },
  'POST  /api/signup': { action: 'entrance/signup' },
  'POST  /api/v1/entrance/send-password-recovery-email': { action: 'entrance/send-password-recovery-email' },
  'POST  /api/v1/entrance/update-password-and-login': { action: 'entrance/update-password-and-login' },
  'POST  /api/v1/deliver-contact-form-message': { action: 'deliver-contact-form-message' },

  'POST /payfort/authorization': 'PaymentsController.askForAuthorization',



  /***************
   * 
   * USER 
   * 
   */
  // check if email exist
  'GET /api/user/email/:email/': 'UserController.emailExist',

  //Para verificar el codigo
  'GET /api/verification/:id/:code': "UserController.verificationCode",

  //Para forgot password
  'POST /api/user/forgot': 'UserController.resetEmail',

  //Para actualizar la contraseña despues de enviar el codigo al correo
  'PUT /api/user/password': 'UserController.changePassword',

  //Para actualizar la contraseña usando la contraseña actual
  'PUT /api/user/update-password': 'UserController.updatePassword',

  //Para enviar datos del formulario de contacto
  "POST /api/contact-form/:id": "UserController.sendMessageContact",

  //Para obtener admins
  'GET /api/user/admins': 'UserController.getAdmins',

  //Para Eliminar el usuario
  'DELETE /api/user/:id': 'UserController.deleteUser',

  //Para que actualize el status del usuario
  'PUT /user/status/:id/:status': 'UserController.updateStatus',

  "GET /user-not-verified": "UserController.getUsersNotVerfied",

  "GET /user/ip": "UserController.getPublicIp",

  // 'PUT /user':'UserController.updateUser',

  /*************
   * 
   * IMAGES
   * 
   */

  //para subir license de usuario
  'POST /api/user/license/:id': 'ImageController.saveImageLicence',

  //get image license
  'GET /api/images/license/:namefile/:id': 'ImageController.getImagesLicense',

  //subir una imagen for a fish
  'POST /api/images': 'ImageController.imagesUpload',




  //Para guardar multiples images de un producto
  'POST /api/fish/images/:id': 'ImageController.multipleImagesUpload',

  //Para actualizar images
  'PUT /api/fish/images/:id': 'ImageController.updateImages',

  //Eliminar varias imagenes a la ves
  'PUT /api/fish/images/delete/:id': 'ImageController.deleteImagesFish',

  //Para obtener images custom
  'GET /api/images/:namefile/:id': 'ImageController.getImage',

  //Para eliminar imagenes
  'DELETE /api/images/:namefile/:id': 'ImageController.deleteImage',

  'DELETE /api/images/category/:namefile/:id/': 'ImageController.deleteImageCategory',

  //Para guardar la imagen de tracking de items sohopping
  'POST /api/itemshopping/trackingfile/:id': 'ImageController.saveImageTrackingFile',

  ////get la imagen de tracking de items sohopping
  'GET /api/images/trackingfile/:namefile/:id': 'ImageController.getTrackingFile',

  "PUT /api/user-logo-company": "ImageController.saveImageLogoCompany",

  //get image of logo company, user
  "GET /api/logo-company/:userID": "ImageController.getImageLogoCompany",

  /***********
   * 
   * FISH AND FISHTYPE
   * 
   */


  /****************
   * Fish Variations
   */
  "POST /api/variations/add": "FishController.addFishWithVariations",

  "PUT /api/variations": "FishController.updateFishWithVariations",


  "GET /api/fish/:id/variations/": "FishController.getFishWithVariations",

  //search variations by weight
  "POST /fish/filter": "FishController.filterFishWithVariations",

  //add new product and send email
  "POST /fish": "FishController.addFish",
  //Para guardar multiples productos
  "POST /api/fishs": "FishController.saveMulti",

  //Para eleimnar un producto
  'DELETE /api/fish/:id': 'FishController.delete',

  //para buscar mariscos por tipos
  'GET /api/fish-type/:name/:page/:limit': 'FishTypeController.getXNamePagination',

  //Para obtener los productos
  'GET /api/fish/:page/:limit': 'FishController.getAllPagination',

  //GET pending fishes
  'GET /api/fish/pending': 'FishController.getPendingProducts',

  //update fish status
  'PUT /api/fish/:id/status/:statusID': 'FishController.updateStatus',

  //Para obtener los productos por medio de where
  'GET /api/fish/:where': "FishController.customWhere",

  //Para obtener los productos por medio de where
  'POST /api/fish/search/:page/:limit': "FishController.search",

  //Para obtener sugerencias de los productos
  "POST /api/fish/suggestions": "FishController.getSuggestions",

  //Para obtener por multiple id
  'GET /api/fish-ids/:ids': 'FishController.getXMultipleID',

  "GET /fishtype": "FishController.getFishs",

  //Para guardar images en las categorias (FishType)
  'POST /api/fishtype/images/:id': "ImageController.multipleImagesCategory",

  //Para establecer una imagen primary en el maricos
  'POST /api/fish/image/:id': 'ImageController.setPrimaryImage',

  //Para obtener imagenes de las categorias
  'GET /api/images/category/:namefile/:id': "ImageController.getImagesCategory",

  //Para obtener imagen primaria de un producto
  'GET /api/images/primary/:namefile/:id': 'ImageController.getImagePrimary',

  //Para elimnar la imagen
  'PUT /api/images/primary/:namefile/:id': 'ImageController.updateImagePrimary',

  //Para obtener productos comprador por type
  'GET /api/fish/type/:type': "FishController.getXTypeWithDataEspecified",

  //Para obtener productos comprados agrupados por categoria
  'GET /api/fish/type': "FishController.getWithDataEspecified",

  //Generate a new Seafood Souq SKU for the new fish
  'POST /api/fish/fish/sku': "FishController.generateSKU",

  /***************************
   * 
   * STORE 
   * 
   */
  // Get all seafood souq products with types for admin edit 
  "GET /store/allProducts": "StoreController.getAllProductsWithTypes",

  //Para obtener stores simplificados con toda su informaciòn
  'GET /api/store': "StoreController.getStoreSimplified",

  //Get Store con los types
  "GET /store/:id": "StoreController.getWithTypes",


  //Para guardar store con todo y sus imagenes
  'POST /api/store': "StoreController.save",

  //Para actualizar o guardar logo
  'POST /api/store/logo/:id': "ImageController.saveLogoStore",

  //Para actualizar o guardar hero image
  'POST /api/store/hero/:id': "ImageController.saveHeroStore",

  //Para actualizar o guardar hero image
  'POST /api/store/gallery/:id': "ImageController.saveImagesStore",

  //Para obtener el logo y hero de store
  'GET /api/store/images/:main/:namefile/:id': "ImageController.getLogoAndHeroStore",

  //Para Obtener galeria de imagenes para store
  'GET /api/store/images/:namefile/:id': 'ImageController.getImagesStore',

  //Para obtener store for id
  'GET /api/store/user/:id': 'StoreController.getXUser',

  //Para obtener productos pagados por tienda
  'GET /api/store/fish/paid/:id': 'ItemShoppingController.getItemsXStorePaid',

  // Get store orders
  'GET /api/store/orders/:status/user/:id': 'StoreController.getStoreOrders',

  // Get all items of the store
  'GET /api/store/:owner/order/:shoppingCartID': 'StoreController.getStoreOrderItems',


  //Para obtener productos pagados por tienda y items shippingStatus === 'paid'
  'GET /api/store/fish/items/paid/:id': 'ItemShoppingController.getItemsXStoreAndItemPaid',

  //Para subir las images sfs
  "POST /api/store/sfs/:id": "StoreController.uploadImagesSFS",

  //Para obtener el sfs image
  "GET /image/store/sfs/:namefile/:id": "StoreController.getImageSFS",

  //Delete sfs image
  "DELETE /image/store/sfs/:sfs/:id": "StoreController.deleteImageSFS",

  //Update sfs Image
  "PUT /image/store/sfs/:sfs/:id": "StoreController.updateImageSFS",

  /***********
   * 
   * SHOPPING CART
   * 
   */

  //Para crear un carrito
  'POST /shoppingcart': 'ShoppingCart.createCart',

  //Para agregar un producto al carrito de compra
  'POST /api/shopping/add/:id': 'ShoppingCartController.addItem',

  //Para obtener el store por id
  'GET /shoppingcart/:id': 'ShoppingCartController.getPopulateXID',

  //Para update items for cart
  'PUT /shoppingcart/items': 'ShoppingCartController.updateItems',

  //Para actualizar un carrito de productos a pagado.
  'PUT /api/shoppingcart/:id': "ShoppingCartController.updateShoppingCartPaid",

  //Get Cart paid x buyer
  'GET /api/cart/paid/:buyer': "ShoppingCartController.getCartPaid",

  // Get open orders 
  'GET /api/orders/open/:buyer': "ShoppingCartController.getOpenOrders",

  //test order
  'GET /api/shoppingcart/orderlogistic': 'ShoppingCartController.getOrderLogistic',

  'GET /api/shoppingcart/PDF/:name/:directory': 'ShoppingCartController.sendPDF',

  /***********
   * 
   * ITEMS SHOPPING 
   * 
   */

  //Para obtener items del carrito
  'GET /api/items/:user/:id': "ItemShoppingController.getItemsXCart",

  //Para actualizar status y enviar email
  'PUT /api/itemshopping/status/:id': "ItemShoppingController.updateStatusToShipped",

  //get shipping images from cart
  'GET /api/ItemShopping/shipping/images/:itemID/:imageIndex': "ImageController.serveShippingImage",

  //change status and send emails
  'PUT /api/itemshopping/:id/:status': "ItemShoppingController.updateItemStatus",

  'GET /api/fish/:id/variation/:variation_id/charges/:weight/:in_AED': 'FishController.getItemCharges',

  // get all orders
  'GET /api/itemshopping/all': 'ItemShoppingController.getAllOrders',
  // get all orders by status
  'GET /api/itemshopping/status/:status': 'ItemShoppingController.getAllOrders',
  // get all orders by order number
  'GET /api/itemshopping/order-number/:orderNumber': 'ItemShoppingController.getAllOrders',
  // get all orders by status and order number
  'GET /api/itemshopping/status/:status/order-number/:orderNumber': 'ItemShoppingController.getAllOrders',


  // get all orders of buyer
  'GET /api/itemshopping/:buyer/all': 'ItemShoppingController.getBuyerOrders',
  // get all canceled and delivered items
  'GET /api/itemshopping/:buyer/canceled-delivered': 'ItemShoppingController.getBuyerCanceledDeliveredOrders',
  // get all orders by status of buyer
  'GET /api/itemshopping/:buyer/status/:status': 'ItemShoppingController.getBuyerOrders',
  // get all orders by order number of buyer
  'GET /api/itemshopping/:buyer/order-number/:orderNumber': 'ItemShoppingController.getBuyerOrders',
  // get all orders by status and order number of buyer
  'GET /api/itemshopping/:buyer/status/:status/order-number/:orderNumber': 'ItemShoppingController.getBuyerOrders',

  'PUT /api/itemsshopping/updateETA': 'ItemShoppingController.updateBuyerETA',

  'POST /api/itemshopping/:id/shipping-documents': 'ItemShopping.uploadShippingDocuments',

  'GET /api/itemshopping/:id/shipping-documents/:name': 'Image.getShippingFiles',

  /********
   * 
   * FAVORITE FISH
   * 
   */

  //Para obtener fish por user
  'GET /api/favoritefish/:id': 'FavoriteFish.getXUSer',

  //Para saber si el usuario ya tiene ese producto como favorito
  'POST /api/favoritefish': 'FavoriteFishController.getXUserAndFish',

  /********
* 
* ITEM SHOPPING
* 
*/

  //Para obtener fish por user
  'GET /itemshopping/:id': 'ItemShoppingController.getWithAllData',

  //Get items by status

  'GET /itemshopping/status/:status': 'ItemShoppingController.getItemsByStatus',
  'GET /itemshopping/payed': 'ItemShoppingController.getPayedItems',
  'GET /itemshopping/cancel': 'ItemShoppingController.getCancelledItems',

  //get items by status and order number
  'GET /itemshopping/payed/:orderNumber': 'ItemShoppingController.getPayedItemsByOrderNumber',

  /***********
   * FILES UPLOAD ADMIN
   */
  'GET /api/admin/files': 'FilesUploadController.getFiles',
  'POST /api/admin/files': 'FilesUploadController.saveFiles',
  'GET /api/admin/:filename/files': 'FilesUploadController.getFile',
  'DELETE /api/admin/:filename/files': 'FilesUploadController.deleteFile',

  /******
   * FEATURED TYPES
   */
  "POST /featuredtypes": "FeaturedTypesController.saveOrUpdate",

  "GET /featuredtypes": "FeaturedTypesController.get",

  /******
  * FEATURED TYPES MENU
  */
  "POST /featuredtypes-menu": "FishTypeMenu.saveOrUpdate",

  "GET /featuredtypes-menu": "FishTypeMenu.get",

  /********
   * 
   * AVENCED SEARCH
   * 
   */
  "GET /search-avanced/:page/:limit": "FishController.searchAvanced",

  "GET /fish/country": "FishController.getDistinctCountry",

  //Para obtener categorias padres
  'GET /fishTypes/parents': 'FishTypeController.getParentTypes',
  'GET /fishTypes/childs': 'FishTypeController.getChildTypes',
  'GET /fishTypes/:parent_id/childs': 'FishTypeController.getParentChildTypes',

  'GET /fishTypes/parents/with-fishes': 'FishTypeController.getParentsWithFishes',

  // get fish type by level
  'GET /fishType/parents/:fishID': 'FishType.getParentLevel',

  'GET /getTypeLevel': 'FishType.getTypeLevel',

  'GET /allFishTypeParents': 'FishTypeController.getAllParentsLevel',
  'GET /fishTypes/Tree': 'FishTypeController.getFishTypeTree',

  'GET /fishTypes/level/:level': 'FishTypeController.getTypeByLevel',
  'GET /fishTypes/:parent_id/all_levels': 'FishTypeController.getAllChildsByLevel',

  //before_variations
  'GET /fishTypes/:parent_id/ori_all_levels': 'FishTypeController.ori_getAllChildsByLevel',


  'POST /fish/filter-old': 'FishController.filterProducts',

  'GET /fishTypes/update_count': 'FishTypeController.updateTypeCount',

  'DELETE /api/fishType/:id': 'FishTypeController.delete',

  //SHIPPING
  'GET /shippingRates/countries': 'ShippingRates.getCountryWithShippings',
  'GET /shippingRates/country/:country/:weight': 'ShippingRates.getShippingRateByWeight',
  'POST /shippingRates/countries': 'ShippingRates.getCountriesShippingRateByWeight',

  'GET /shippingRates/country/:country/cities/': 'ShippingRates.getCitiesWithShippings',
  'POST /shippingRates/cities': 'ShippingRates.getCitiesShippingRateByWeight',

  'POST /shippingRates/bycity': 'ShippingRates.getShippingRateByCity',

  'GET /countries/cities': 'Countries.getAllCities',

  'POST /shipping/:id/upload/': 'Image.uploadShippingInformation',

  //PRICING
  'GET /pricingCharges/history': 'PricingCharges.getPricingChargesHistory',
  'GET /pricingCharges/current': 'PricingCharges.getCurrentPricingCharges',

  'GET /pricingCharges/fish/:id': 'PricingCharges.getFishPricingCharges',

  // COUNTRIES
  'PUT /api/countries/cityeta': 'Countries.updateCityEta',

  'PUT /api/countries/city': 'Countries.updateCity',

  'PUT /api/countries/city/delete': 'Countries.deleteCity',

  'GET /api/countries/withCities': 'Countries.getCountriesWithCities',

  // XERO Invoice services
  'GET /xero/connect': 'Xero.connect',

  //trimming
  'GET /storeTrimming/store/:store': 'StoreTrimming.getStoreTrimming',

  //Order Status
  'GET /api/orderStatus/logistic': 'OrderStatus.getLogisticOrderstatus',

  'GET /api/orderStatus/payments': 'OrderStatus.getPaymentOrderstatus',

  // Get all orders by status
  'GET /api/store/:owner_id/order/status/:status_id': 'StoreController.getStoreOrdersByItemStatus',

  /*****
   * 
   * DOSUSIGN
   * 
   * 
   */
  'POST /docusign': 'DocusignController.sentTemplate',

  //  ╦ ╦╔═╗╔╗ ╦ ╦╔═╗╔═╗╦╔═╔═╗
  //  ║║║║╣ ╠╩╗╠═╣║ ║║ ║╠╩╗╚═╗
  //  ╚╩╝╚═╝╚═╝╩ ╩╚═╝╚═╝╩ ╩╚═╝
  //payments
  'POST /payments/payfort': 'PaymentsController.getAuthorization',

  'GET /xero/updateToken': 'Xero.updateXero',

  //Docusign
  'POST /response-docusign': 'DocusignController.resposeEnvelope',

  //  ╔╦╗╦╔═╗╔═╗  ╦═╗╔═╗╔╦╗╦╦═╗╔═╗╔═╗╔╦╗╔═╗
  //  ║║║║╚═╗║    ╠╦╝║╣  ║║║╠╦╝║╣ ║   ║ ╚═╗
  //  ╩ ╩╩╚═╝╚═╝  ╩╚═╚═╝═╩╝╩╩╚═╚═╝╚═╝ ╩ ╚═╝
  '/terms': '/legal/terms',
  '/logout': '/api/v1/account/logout',


  //#region for api v2
  /****
   * 
   * FOR USERS
   * 
   * 
   */
  "GET /api/v2/user": "UserController.getUsers",

  // Shipping

  'GET /api/v2/countriesWithShipping': "ShippingRatesController.getCountriesWithShippings",

  /****
   * 
   * 
   * ITEMS SHOPPING
   * 
   * 
   */
  //get orders for buyer
  'GET /api/v2/itemshopping/:buyer/all': 'ItemShoppingController.getBuyerOrdersPagination',

  'GET /api/v2/itemshopping/:buyer/status/:status': 'ItemShoppingController.getBuyerOrdersPagination',

  'GET /api/v2/itemshopping/:buyer/order-number/:orderNumber': 'ItemShoppingController.getBuyerOrdersPagination',

  'GET /api/v2/itemshopping/:buyer/status/:status/order-number/:orderNumber': 'ItemShoppingController.getBuyerOrdersPagination',

  //Get orders for admin
  'GET /api/v2/itemshopping/all': 'ItemShoppingController.getAllOrdersPagination', 

  'GET /api/v2/itemshopping/status/:status': 'ItemShoppingController.getAllOrdersPagination',

  'GET /api/v2/itemshopping/order-number/:orderNumber': 'ItemShoppingController.getAllOrdersPagination',

  'GET /api/v2/itemshopping/status/:status/order-number/:orderNumber': 'ItemShoppingController.getAllOrdersPagination',

  'GET /api/v2/orderStatus/logistic': 'OrderStatus.getLogisticOrderstatusPagination',

  'GET /api/v2/orderStatus/payments': 'OrderStatus.getPaymentOrderstatusPagination',

  'GET /api/v2/shoppingcart/orderlogistic': 'ShoppingCartController.getOrderLogisticPagination',


  'GET /api/v2/itemshopping/payed': 'ItemShoppingController.getPayedItemsPagination',

  'GET /itemshopping/cancel': 'ItemShoppingController.getCancelledItems',

  //get items by status and order number
  // 'GET /api/v2/itemshopping/payed/:orderNumber': 'ItemShoppingController.getPayedItemsByOrderNumber',

  //#endregion
};
