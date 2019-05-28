module.exports = {


  friendlyName: 'Shipping by seller',


  description: `this function is different from the helper shipping-fee because the First Mile Cost and weight are the total of all products of the same store in the order,
                We use this for charge the store one shipping for the order and not per item`,


  inputs: {
    firstMileFee: {
      type: "number",
      required: true
    }, 
    city: {
      type: "string",
      required: true
    }, 
    weight: {
      type: "number",
      required: true
    }, 
    currentAdminCharges: {
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
    shipping = await sails.helpers.shippingByCity( inputs.city, inputs.weight ); 

    //calculate cost       
    let shippingFee   = shipping * inputs.weight; //b1
    let handlingFee   = inputs.currentAdminCharges.handlingFees * inputs.weight; //b2 //are 3 AED/KG to get the shipment released from Customs.
    let shippingCost  = inputs.firstMileFee + shippingFee + handlingFee + inputs.currentAdminCharges.lastMileCost; //C = first mile cost + b1 + b2 + last mile cost
        
    // All done.
    return exits.success( { firstMileFee: inputs.firstMileFee, shippingFee, handlingFee, shippingCost } );

  }


};

