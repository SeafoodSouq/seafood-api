module.exports = {


  friendlyName: 'Fish pricing',


  description: 'Get all pricing for a fish',


  inputs: {
    id: {
      type: "string",
      required: true
    },
    weight: {
      type: "number",
      required: true
    },
    currentCharges: {
      type: "ref",
      required: true
    },
    variation_id: {
      type: 'string',
      required: false
    },
    in_AED: {
      type: 'boolean',
      required: true
    }
  },


  exits: {
    outputType:{
      result: "ref"
    }
  },


  fn: async function (inputs, exits) {
    let id = inputs.id; //Fish ID 
    let weight = inputs.weight; // Weight to query
    let currentAdminCharges = inputs.currentCharges; // charges manages by admin
    let is_flat_custom = false;

    // getting the fish information
    let fish = await Fish.findOne( { where: { id: id } } ).populate( 'type' ).populate( 'store' ).populate('descriptor');   
    console.log( 'fish', fish );
    if( fish.hasOwnProperty("perBox") ) {
      if( fish.perBox === true) { // if is per box the api is sending the number of boxes, not the weight
        weight = fish.boxWeight * weight;
        inputs.weight = weight;
      }
    }

    let variation = await VariationPrices.find().where({
      'min': { "<=": inputs.weight },
      'max': { ">=": inputs.weight },
      variation: inputs.variation_id
    }).populate('variation').limit(1);

    if( variation.length == 0 ){
      variation = await VariationPrices.find().where({        
        variation: inputs.variation_id
      }).populate('variation').limit(1);
    }

    variation = variation[0];    

    //if is not filleted ( include trims ) we use a flat rate for customs
    if( variation.variation.fishPreparation !== '5c93c01465e25a011eefbcc4' && variation.variation.fishPreparation !== '5c4b9b8e23a9a60223553d04' && variation.variation.fishPreparation !== '5c4b9ba023a9a60223553d05' && variation.variation.fishPreparation !== '5c4b9ba523a9a60223553d06' && variation.variation.fishPreparation !== '5c4b9baa23a9a60223553d07' && variation.variation.fishPreparation !== '5c4b9bae23a9a60223553d08' ) {
      currentAdminCharges.customs = currentAdminCharges.flatCustoms;
      is_flat_custom = true;
    }
    

    if( variation === undefined ) {
      // when there is no variation we are going to use the last range of price      
      await VariationPrices.find( { variation: inputs.variation_id } )
          .sort( [{ max: 'ASC' }] )
          .then( 
              result => {
                  var BreakException = {};
                  try {
                      let resultSize = Object.keys(result).length ;
                      let resultCount = 0;
                      result.forEach( row => {
                          resultCount +=1 ;
                          if( resultCount == resultSize ){
                              variation = row;
                              throw BreakException;
                          }                          
                      });                      
                  } catch (e) {
                      
                  return false;                  
                  }
                  
              },
              error => {
                  console.log(error);
              }
          )

    } 
    let fishPrice = Number( parseFloat( variation.price ) );

    //chaging price to AED
    fishPrice = fishPrice * currentAdminCharges['exchangeRates'];      
    variation.price = fishPrice; //actualizamos el valor en variation
    // getting shipping rate from that city in AED
    shipping = await sails.helpers.shippingByCity( fish.city, weight );
  
    exchangeRates   = currentAdminCharges.exchangeRates;

    let owner = await User.findOne( { id: fish.store.owner } ) ;
    let marginPercentage  = 0; //await IncotermsByType.find( { incoterm: owner.incoterms, type: fish.type.id } );
    if ( owner.incoterms === '5cbf6900aa5dbb0733b05be4' ) { // exworks

      if ( fish.descriptor !== null ){
        sfsMargin = fish.descriptor.exworks;
        marginPercentage = fish.descriptor.exworks; 
      } else {
        if( fish.type.hasOwnProperty('exworks') ) {
          sfsMargin = fish.type.exworks;
          marginPercentage = fish.type.exworks; 
        }
        else {
          sfsMargin = 1;
          marginPercentage = 1;
        }
      }

      
    } else if( owner.incoterms === '5cbf68f7aa5dbb0733b05be3' ) {
      if ( fish.descriptor !== null ){
        sfsMargin = fish.descriptor.cpi;
        marginPercentage = fish.descriptor.cpi;
      } else { 
        if( fish.type.hasOwnProperty('cpi') ) {
          sfsMargin = fish.type.cpi;
          marginPercentage = fish.type.cpi;
        }
        else {
          sfsMargin = 1;
          marginPercentage = 1;
        }
      }

      
    } else {
      if( fish.type.hasOwnProperty('exworks') ) {
        sfsMargin = fish.type.exworks;
        marginPercentage = fish.type.exworks; 
      }
      else {
        sfsMargin = 1;
        marginPercentage = 1;
      }
    }
    
    // getting fish shipping fee
    let shippingFees = await sails.helpers.shippingFee( fish, weight, currentAdminCharges );

    //calculate cost using seafoodsouq formula
    let fishCost = (fishPrice * weight); // A

    let sfsMarginCost = (sfsMargin / 100) * fishCost; // D= SFS Fee A //calculated from the total amount of the the product sales excluding shipping fees and taxes.
    let customsFee    = currentAdminCharges.customs; //E= Customs rate * A  //Customs in the UAE are 5% on the Seller’s invoice (The seller’s Sale excluding additional Costs
    if( !is_flat_custom ) { // if is not flat custom then we use the percentaje;
      customsFee = ( currentAdminCharges.customs / 100 )  * fishCost
    }
    let exchangeRateCommission = ( fishCost + shippingFees.firstMileFee ) * ( currentAdminCharges.exchangeRateCommission / 100 );
    let uaeTaxesFee   = ( fishCost + shippingFees.shippingCost + customsFee + sfsMarginCost  ) * ( currentAdminCharges.uaeTaxes  / 100 ); //F = (A+C+D+E) Tax
    let finalPrice    = fishCost + exchangeRateCommission + shippingFees.shippingCost + sfsMarginCost + customsFee + uaeTaxesFee ;

    if( inputs.in_AED ){      
      exchangeRates = 1;
    } else {
      variation.price = Number(parseFloat( variation.price / exchangeRates ).toFixed(2));
    }

    //returning json
    let charges = {
        price: Number(parseFloat(fishPrice / exchangeRates).toFixed(2)),
        weight: Number(parseFloat(weight).toFixed(2)),
        sfsMargin: Number(parseFloat(sfsMargin).toFixed(2)),
        shipping: Number(parseFloat(shipping / exchangeRates).toFixed(2)),
        customs: Number(parseFloat(currentAdminCharges.customs ).toFixed(2)),
        uaeTaxes: Number(parseFloat(currentAdminCharges.uaeTaxes ).toFixed(2)),
        fishCost: Number(parseFloat(fishCost / exchangeRates).toFixed(2)),
        firstMileCost: Number(parseFloat(shippingFees.firstMileCost / exchangeRates).toFixed(2)),        
        lastMileCost: Number(parseFloat(currentAdminCharges.lastMileCost / exchangeRates).toFixed(2)),
        shippingFee: Number(parseFloat(shippingFees.shippingFee / exchangeRates).toFixed(2)),
        customsFee: Number(parseFloat(customsFee / exchangeRates).toFixed(2)),
        handlingFee: Number(parseFloat(shippingFees.handlingFee / exchangeRates).toFixed(2)),
        firstMileFee: Number(parseFloat(shippingFees.firstMileFee / exchangeRates).toFixed(2)),
        shippingCost: {
            cost: Number(parseFloat(shippingFees.shippingCost / exchangeRates).toFixed(2)),
            include: 'first mile cost + shipping fee + handling fee + last mile cost'
        },
        exchangeRateCommission: Number(parseFloat(exchangeRateCommission / exchangeRates).toFixed(2)),
        sfsMarginCost: Number(parseFloat(sfsMarginCost / exchangeRates).toFixed(2)),
        uaeTaxesFee: Number(parseFloat(uaeTaxesFee / exchangeRates).toFixed(2)),
        finalPrice: Number(parseFloat(finalPrice / exchangeRates).toFixed(2)),
        marginPercentage,
        variation
    }

    // All done.
    return exits.success( charges );

  }


};

