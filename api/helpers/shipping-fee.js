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

    if( !owner.hasOwnProperty( 'incoterms' ) ) {    
      owner['incoterms'] = '5cbf68f7aa5dbb0733b05be2';
    }

    //let marginPercentage  = await IncotermsByType.findOne( { incoterms: owner.incoterms, type: inputs.fish.type.id } )
    let firstMileCost;
    let firstMileFee;
  
    // getting shipping rate from that city
    shipping = await sails.helpers.shippingByCity( inputs.fish.city, inputs.weight );

    let shippingFee;
    let handlingFee;
    let shippingCost;

    if( owner.incoterms === '5cbf68f7aa5dbb0733b05be3' ) { // CIP
      firstMileCost = 0; //get owner fee
      firstMileFee  = firstMileCost * inputs.weight;
      shippingFee   = shipping * inputs.weight; //b1
      handlingFee   = inputs.currentCharges.handlingFees * inputs.weight; //b2 //are 3 AED/KG to get the shipment released from Customs.
      shippingCost  = handlingFee + inputs.currentCharges.lastMileCost; //C = first mile cost + b1 + b2 + last mile cost
    } else { // Ex Work
      firstMileCost = Number( parseFloat( owner.firstMileCost ) ); //get owner fee
      firstMileFee  = firstMileCost * inputs.weight;
      shippingFee   = shipping * inputs.weight; //b1
      handlingFee   = inputs.currentCharges.handlingFees * inputs.weight; //b2 //are 3 AED/KG to get the shipment released from Customs.
      shippingCost  = firstMileFee + shippingFee + handlingFee + inputs.currentCharges.lastMileCost; //C = first mile cost + b1 + b2 + last mile cost
    }
    
    
    let result = { shippingFee, handlingFee, shippingCost, firstMileFee, firstMileCost, fish: inputs.fish }

    // All done.
    return exits.success( result );

  }


};

