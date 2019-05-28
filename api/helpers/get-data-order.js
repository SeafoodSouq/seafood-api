const moment = require("moment");

module.exports = {


  friendlyName: 'Get data order',


  description: '',


  inputs: {
    sellerName: {
      type: "string",
      required: false
    },
    cart: {
      type: "ref",
      required: true
    },
    items: {
      type: "json",
      required: true
    },
    orderNumber: {
      type: "number",
      required: true
    },
    type: {
      type: "string",
      required: true
    },
    URL: {
      type: "string",
      required: true
    }
  },


  exits: {

    outputType: {
      result: "ref"
    }

  },


  fn: async function (inputs, exits) {
    let sellerName = inputs.sellerName,
      cart = inputs.cart,
      items = inputs.items,
      orderNumber = inputs.orderNumber,
      type = inputs.type, URL = inputs.URL;
    items = JSON.parse( JSON.stringify(items) );
    try {
      //Perder la referencia de la variable
      items = JSON.parse(JSON.stringify(items));
      //Para obtener el total y parsiar la fecha de pago
      let grandTotal = 0;
      for (let it of items) {
        if(it.isDefined("total"))
        if (it.isDefined("subtotal") === true)
          grandTotal += Number(it.subtotal);
        else
          grandTotal += Number(parseFloat(Number(it.quantity.value) * Number(it.price.value)).toFixed(2));
        grandTotal += Number(it.shipping);
        grandTotal += Number(it.uaeTaxes);
        grandTotal += Number(it.customs);
        grandTotal += Number(it.sfsMargin);
      }
      grandTotal = Number((grandTotal).toFixed(2));
      if(cart.isDefined("total") === true){
        grandTotal = cart.total;
      }

      let paidDateTime = "";
      if (cart.isDefined("paidDateTime") && cart.paidDateTime !== '') {
        paidDateTime = await sails.helpers.formatDate.with({
          date: new Date(cart.paidDateTime),
          format: "DD/MM/YYYY"
        });
      }

      //Para completar el src de image primary
      for (let i = 0; i < items.length; i++) {
        let it = items[i];
        if (it.fish.imagePrimary && it.fish.imagePrimary !== '') {
          it.fish.imagePrimary = URL + it.fish.imagePrimary;
        } console.log("\n\n", it.buyerExpectedDeliveryDate, "\n\n");
        if (it.isDefined('buyerExpectedDeliveryDate') === true && it.buyerExpectedDeliveryDate !== '' &&
          /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/.test(it.buyerExpectedDeliveryDate) === true) {
          it.buyerExpectedDeliveryDate = moment(it.buyerExpectedDeliveryDate, "MM/DD/YYYY").format("MM/DD/YYYY");
        }
        if (it.isDefined('sellerExpectedDeliveryDate') === true && it.sellerExpectedDeliveryDate !== '' &&
          /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4}/.test(it.sellerExpectedDeliveryDate) === true) {
          it.sellerExpectedDeliveryDate = moment(it.sellerExpectedDeliveryDate, "MM/DD/YYYY").format("MM/DD/YYYY");
        }
        items[i] = it;
      }

      //Para obtener los sellers
      let _stores = [];
      for (let it of items) {
        let ind = _stores.findIndex(i => { return i.id === it.fish.store.id; });
        if (ind === -1) _stores.push(it.fish.store);
      }
      let sellers = "";
      for (let i = 0; i < _stores.length; i++) {
        let space = (i + 1) === _stores.length ? '' : (i + 1) === (_stores.length - 1) ? ' and ' : ', ';
        if (_stores[i].isDefined("owner") === true && _stores[i].owner.typeObject() === "object")
          sellers += _stores[i].owner.firstName + " " + _stores[i].owner.lastName + space;
      }
      if (_stores.length === 1) {
        if (_stores[0].isDefined("owner") === true && _stores[0].owner.typeObject() === "object")
          sellers = _stores[0].owner.firstName + " " + _stores[0].owner.lastName;
      }
      // console.log(type, items, "\n\n");
      return exits.success({
        name: sellerName,
        sellerName: sellerName,
        cart: cart,
        sellers,
        items: items,
        orderNumber: orderNumber,
        url: URL,
        paidDateTime,
        grandTotal
      });
    }
    catch (e) {
      console.error(e);
    }

  }


};

