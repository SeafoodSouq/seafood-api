
module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    uaeTaxes: {
      type: "number",
      required: false
    },
    handlingFees: {
      type: "number",
      required: false
    },
    firstMileCosts: {
      type: "number",
      required: false
    },
    lastMileCost: {
      type: "number",
      required: false
    },
    customs: {
      type: "number",
      required: false
    },
    sfsMargin: {
      type: "number",
      required: false
    },
    shipping: {
      type: "number",
      required: false
    },
    subTotal: {
      type: "number",
      required: false
    },
    totalOtherFees: {
      type: "number",
      required: false
    },
    totalExchangeRatesCommissions: {
      type: "number",
      required: false
    },
    total: {
      type: "number",
      required: false
    },
    currentCharges: {
      type: "json"
    },
    status: {
      type: "string",
      defaultsTo: "pending"
    },

    paidDateTime: {
      type: "string",
      columnType: "datetime",
      required: false
    },
    orderNumber: {
      type: "number",
      required: false
    },
    xeroRef: {
      type: 'string',
      required: false
    },
    xeroLink: {
      type: 'string',
      required: false
    },

    invoice_pdf: {
      type: 'string',
      required: false
    },

    isCOD: {
      type: "boolean",
      required: false
    },

    shippingAddress: {
      type: "json",
      required: false
    },
    billingAddress: {
      type: "json",
      required: false
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝


    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    buyer: {
      model: "user",
      required: true
    },
    clones: {
      collection: 'shoppingcartclone',
      via: 'shoppingCart'
    },
    items: {
      collection: "itemshopping",
      via: "shoppingCart",
      required: false
    },

    orderStatus: {
      model: "OrderStatus",
      required: false
    },

    datePaid: {
      type: 'number',
      required: false
    }
  },

  afterUpdate: async function (cart, next) {
    try{
      if (typeof cart.paidDateTime === 'string' && cart.paidDateTime !== '') {
        let datePaid = new Date(cart.paidDateTime).getTime();
        await ShoppingCart.update({ id: cart.id }, { datePaid });
      }
      next();
    }
    catch(e){
      console.error(e);
      next(e);
    }
  }

};

