module.exports = {


  friendlyName: 'Kg conversion rate',


  description: '',


  inputs: {
    fish: {
      type: "json",
      required: true
    },
    weight: {
      type: "number",
      required: true
    }
  },


  exits: {

    outputType:{
      result: "number"
    }

  },


  fn: async function (inputs, exits) {
    // TODO
    let variation = await Variations.find( { fish: inputs.fish.id } ).limit(1);
    let kgConversionRate = 0;
    
    if( !variation[0].hasOwnProperty('kgConversionRate') || variation[0].kgConversionRate == undefined || variation[0].kgConversionRate == null || variation[0].kgConversionRate == 0 ) {
      let fishType = inputs.fish.type;
      if( inputs.fish.type.hasOwnProperty( 'id' ) ) {
        fishType = inputs.fish.type.id;
      }
      //let fishInformation = await FishType.findOne( { id: fishType } ); // we are getting the unit of measure 
      let unitOfMeasure = await UnitOfMeasure.findOne( { name: inputs.fish.unitOfSale, isActive: true } )
      kgConversionRate = unitOfMeasure.kgConversionRate;
    } else {
      kgConversionRate = variation[0].kgConversionRate;
    }
    

    let weightInKG = inputs.weight * kgConversionRate;

    return exits.success( weightInKG );
  }


};
