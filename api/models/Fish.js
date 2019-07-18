

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    name: {
      type: "string",
      required: true
    },

    brandname: {
      type: "string",
      required: false
    },

    description: {
      type: "string",
      required: false
    },

    country: {
      type: "string",
      required: true
    },

    processingCountry: {
      type: "string",
      required: true
    },

    city: {
      type: "string",
      required: true
    },

    quality: {
      type: 'string',
      maxLength: 200,
      required: false
    },

    minimumOrder:{
      type: "number",
      required: false
    },

    maximumOrder:{
      type: "number",
      required: false
    },

    unitOfSale: {
      type: "string",
      required: false
    },  

    /* // moved to variations
    preparation: {
      type: "string", 
      required: true
    },*/

    
/* // moved to variations
    wholeFishWeight: {
      type: "string",
      required: false
    },
*/

    
    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝
    /* // moved to variations
    weight: {
      type: 'json',
      required: false,
      example: `
        weight: {
          type: "pounds",
          value: 2
        }
      `
    },

    price: {
      type: 'json',
      required: true,
      example: `
        price: {
          type: "$",
          value: 3,
          description: $2 for pack
        }
      `
    },
*/
    hsCode: {
      type: 'string',
      required: false,
    },

    imagePrimary: {
      type: "json",
      required: false
    },

    images: {
      type: 'json', 
      columnType: 'array',
      required: false
    },

    seller_sku: {
      type: 'string',
      maxLength: 200,
    },
    seafood_sku: {
      type: 'string',
      maxLength: 200,
      required: true,
    },
    SFSAdminFeedback:{
      type:'string'
    },
    stock: {
      type: 'number',
      required: false
    },
    waterLostRate: {
      type: 'string',
      required: false
    },
    mortalityRate: {
      type: 'number',
      required: true
    },
    perBox: {
      type: 'boolean',
      defaultsTo : false
    },
    boxWeight: {
      type: 'number',
      required: false
    },
    cooming_soon: {
      type: "boolean",
      defaultsTo: false
    },
    foreign_fish: {
      type: "boolean",
      defaultsTo: false
    },
    stockStatus: {
      type: "string",
      description: `
        inStock: 1
        outOfStock: 2,
        comingSoo: 3
      `
    },
    orderStatus: {
      type: 'number'
    },
    minDeliveryUnixDate: {
      type: 'number'
    },
    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    
    raised: {
      model: "raised",
      required: true
    },
    treatment: {
      model: "treatment",
      required: true
    },
    
    store: {
      model: "store",
      required: true
    },

    type: {
      model: 'fishtype',
      required: true
    },

    descriptor: {
      model: 'fishtype',
      required: false
    },

    shoppingCart: {
      collection: "itemshopping",
      via: "fish",
      required: false
    },

    status: {
      model: "FishStatus",
      required: true
    }

  },

};

