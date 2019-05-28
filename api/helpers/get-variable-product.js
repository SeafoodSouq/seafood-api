module.exports = {


  friendlyName: 'Get variable product',


  description: '',


  inputs: {
    ids:{
      type: "ref",
      required: false
    },
    variationIds:{ 
      type: "ref",
      required: false
    },
    variationPricesIds: {
      type: 'ref',
      required: false
    }
  },


  exits: {

    success: {
      outputFriendlyName: 'Variable product',
      outputType: 'ref'
    },

  },


  fn: async function (inputs, exits) {
    let fishes;
    try {
      if( inputs.ids !== undefined ){
        console.log( 'getIDS', inputs.ids );
        let fishID = inputs.ids;
        fishes = await Fish.find( { id: fishID } ).populate('status').populate('store').populate('type').populate('descriptor')
      } else {
        console.log( 'noIDs', inputs.ids );
        fishes = await Fish.find().populate('status').populate('store').populate('type').populate('descriptor')
      }


      await Promise.all( 
        fishes.map( async fish => {
          let variations = await Variations.find( { 'fish': fish.id } ).populate( 'fishPreparation' ).populate( 'wholeFishWeight' );

          await Promise.all(
              variations.map( async variation => {
                  console.log( variation.id );
                  let prices = await VariationPrices.find( { 'variation': variation.id } );
                  variation['prices'] = prices;
              } ) 
          );
          fish['variations'] = variations;

        } )
        )

      
      // Send back the result through the success exit.
      return exits.success(fishes);

  } catch (error) {
      res.serverError(error);
  }

  }


};

