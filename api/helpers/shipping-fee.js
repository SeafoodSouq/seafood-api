module.exports = {


  friendlyName: 'Shipping fee',


  description: 'Calculate shippgin fee',


  inputs: {
    fish: {
      type: "ref",
      required: true
    },
    weight: {
      type: "number",
      required: true
    },
    currentCharges: {
      type: "ref",
      required: true
    }
  },


  exits: {
    outputType:{
      result: "ref"
    }
  },


  fn: async function (inputs, exits) {

    let owner = await User.findOne( { id: inputs.fish.store.owner } ) ;
    let firstMileCost = Number( parseFloat( owner.firstMileCost ) ); //get owner fee
    console.info('fmc', firstMileCost);
    console.info('weight', inputs.weight);
    let firstMileFee = firstMileCost * inputs.weight; //* inputs.fish.price.value;

    // getting shipping rate from that city
    shipping = await sails.helpers.shippingByCity( inputs.fish.city, inputs.weight );

    let shippingFee   = shipping * inputs.weight; //b1
    let handlingFee   = inputs.currentCharges.handlingFees * inputs.weight; //b2 //are 3 AED/KG to get the shipment released from Customs.
    console.info('fml', firstMileFee);
    console.info('sf', shippingFee);
    console.info('hf', handlingFee);
    console.info('lmc', inputs.currentCharges.lastMileCost);
    let shippingCost  = firstMileFee + shippingFee + handlingFee + inputs.currentCharges.lastMileCost; //C = first mile cost + b1 + b2 + last mile cost
    console.info('sc', shippingCost);
    let result = { shippingFee, handlingFee, shippingCost, firstMileFee, firstMileCost }

    // All done.
    return exits.success( result );

  }


};

