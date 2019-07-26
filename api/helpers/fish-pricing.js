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
    outputType: {
      result: "ref"
    }
  },


  fn: async function (inputs, exits) {
    let id = inputs.id; //Fish ID 
    let weight = inputs.weight; // Weight to query
    let currentAdminCharges = await sails.helpers.currentCharges();//inputs.currentCharges; // charges manages by admin
    let is_flat_custom = false;    
    let is_domestic = false; // TODO: we had to change this because the name in the database is foreign fish and should be is_domestic
    // getting the fish information
    let fish = await Fish.findOne({ where: { id: id } }).populate('type').populate('store').populate('descriptor');    
    if ( fish.hasOwnProperty( 'foreign_fish' ) )
    is_domestic = fish.foreign_fish; // verificamos si el fish es local

    if (fish.hasOwnProperty("perBox")) {
      if (fish.perBox === true) { // if is per box the api is sending the number of boxes, not the weight
        weight = fish.boxWeight * weight;
        inputs.weight = weight;
      }
    }

    let variation = await VariationPrices.find().where({
      'min': { "<=": inputs.weight },
      'max': { ">=": inputs.weight },
      variation: inputs.variation_id
    }).populate('variation').limit(1);

    if (variation.length == 0) {
       let variations = await VariationPrices.find().where({
        variation: inputs.variation_id
      }).populate('variation').sort("max DESC");

      variation = [ variations[0] ];
    }

    variation = variation[0];

let fishType;
    let kgConversionRate;
    if( !variation.variation.hasOwnProperty('kgConversionRate') || variation.variation.kgConversionRate == undefined || variation.variation.kgConversionRate == null || variation.variation.kgConversionRate == 0 ) {                        
        if( fish.type.hasOwnProperty( 'id' ) ) {
          fishType = fish.type.id;
        }
        //let fishInformation = await FishType.findOne( { id: fishType } ); // we are getting the unit of measure 
        let unitOfMeasure = await UnitOfMeasure.findOne( { name: fish.unitOfSale, isActive: true } )
        kgConversionRate = unitOfMeasure.kgConversionRate;
      } else {
        kgConversionRate = variation.variation.kgConversionRate;
      }

      variation.variation['kgConversionRate'] = kgConversionRate;

    if ( variation.variation.fishPreparation !== '5c93c01465e25a011eefbcc4' && variation.variation.fishPreparation !== '5c4b9b8e23a9a60223553d04' && variation.variation.fishPreparation !== '5c4b9ba023a9a60223553d05' && variation.variation.fishPreparation !== '5c4b9ba523a9a60223553d06' && variation.variation.fishPreparation !== '5c4b9baa23a9a60223553d07' && variation.variation.fishPreparation !== '5c4b9bae23a9a60223553d08') {
      is_flat_custom = true;
      currentAdminCharges['selectedCustoms'] = currentAdminCharges.flatCustoms;  
    }  else {
      currentAdminCharges['selectedCustoms'] = currentAdminCharges.customs;
    }
  
    if (is_domestic && is_domestic === true) {
      currentAdminCharges.selectedCustoms = 0;
    }


    if (variation === undefined) {
      // when there is no variation we are going to use the last range of price      
      await VariationPrices.find({ variation: inputs.variation_id })
        .sort([{ max: 'ASC' }])
        .then(
          result => {
            var BreakException = {};
            try {
              let resultSize = Object.keys(result).length;
              let resultCount = 0;
              result.forEach(row => {
                resultCount += 1;
                if (resultCount == resultSize) {
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
    let fishPrice = Number(parseFloat(variation.price).toFixed(2));

    //chaging price to AED
    fishPrice = Number(parseFloat(fishPrice * currentAdminCharges['exchangeRates']).toFixed(2));
    variation.price = fishPrice; //actualizamos el valor en variation
    // getting shipping rate from that city in AED
    //console.log( 'city', fish.city );
    shipping = await sails.helpers.shippingByCity(fish.city, weight);

    exchangeRates = currentAdminCharges.exchangeRates;

    let owner = await User.findOne({ id: fish.store.owner });
    let sfsMargin = 0;
    let marginPercentage = 0; //await IncotermsByType.find( { incoterm: owner.incoterms, type: fish.type.id } );

    // new fee based on inventory
    console.info( 'current', currentAdminCharges );
    let fixedHanlingFees = currentAdminCharges.flatHandlingFees; // X
    let pickupLogistic = currentAdminCharges.pickupLogistics; // Y
    let partnerFreightCost = currentAdminCharges.partnerFreightCosts; // Z
    let stock = await sails.helpers.getEtaStock( inputs.variation_id, weight ); // S | here we have the stock record plus available field = quantity - purchased
    if( stock === 0 ) { // is out of stock
      partnerFreightCost = 0; 
      stock = { available: 1 };
    } else {
      //if( stock.hasOwnProperty( 'pickupCost' ) ) // for backwards compatibility, if no stock, then use 0
        //partnerFreightCost = stock.pickupCost
    }

    let inventoryFee = 0; // H
    let inventoryFeeByWeight = 0; // I
    let charges = {};
    if ( is_domestic ) { // if the fish is from uae we use CIP and we don't include handling fees
      console.log( 'is_domestic', is_domestic );
      //calculate cost using seafoodsouq formula
      let fishCost = Number(parseFloat(fishPrice * weight).toFixed(2)); // A
      let lastMileCost = Number(parseFloat(currentAdminCharges.lastMileCost).toFixed(2)); // C
      
      // getting CIP
      if (fish.descriptor !== null) {
        sfsMargin = fish.descriptor.cpi;
        marginPercentage = fish.descriptor.cpi;
      } else if (fish.type.hasOwnProperty('cpi')) {
        sfsMargin = fish.type.cpi;
        marginPercentage = fish.type.cpi;
      } else {
        sfsMargin = 0;
        marginPercentage = 0;
      }
      let sfsMarginCost = Number(parseFloat((sfsMargin / 100) * fishCost).toFixed(2) ) ; // D
      inventoryFee = pickupLogistic / stock.available; // H = Y / S
      inventoryFeeByWeight = inventoryFee * weight; // I = H * weight

      let uaeTaxesFee = Number(parseFloat((fishCost + lastMileCost + sfsMarginCost + inventoryFeeByWeight  ) * (currentAdminCharges.uaeTaxes / 100)).toFixed(2)); //F = (A+C+D+E) Tax // MREC  adding inventory fee taxable inventoryFeeByWeight
      // ask about this because is local
      let exchangeRateCommission = Number(parseFloat((fishCost) * (currentAdminCharges.exchangeRateCommission / 100)).toFixed(2));

      let finalPrice = Number(parseFloat(fishCost + lastMileCost +sfsMarginCost + uaeTaxesFee + inventoryFeeByWeight + exchangeRateCommission ).toFixed(2));

      if (inputs.in_AED) {
        exchangeRates = 1;
      } else {
        variation.price = Number(parseFloat(variation.price / exchangeRates).toFixed(2));
      }
  
      //returning json
      charges = {
        price: Number(parseFloat(fishPrice / exchangeRates).toFixed(2)),
        weight: Number(parseFloat(weight).toFixed(2)),
        sfsMargin: Number(parseFloat(sfsMargin).toFixed(2)),
        shipping: 0,
        customs: Number(parseFloat(currentAdminCharges.selectedCustoms).toFixed(2)),
        uaeTaxes: Number(parseFloat(currentAdminCharges.uaeTaxes).toFixed(2)),
        fishCost: Number(parseFloat(fishCost / exchangeRates).toFixed(2)),
        firstMileCost: 0,
        lastMileCost: Number(parseFloat(currentAdminCharges.lastMileCost / exchangeRates).toFixed(2)),
        shippingFee: Number(parseFloat(currentAdminCharges.lastMileCost / exchangeRates).toFixed(2)),
        customsFee: 0,
        handlingFee: 0,
        firstMileFee: 0,
        shippingCost: {
          cost: Number(parseFloat(currentAdminCharges.lastMileCost / exchangeRates).toFixed(2)),
          include: 'first mile cost + shipping fee + handling fee + last mile cost'
        },
        exchangeRateCommission: Number(parseFloat(exchangeRateCommission / exchangeRates).toFixed(2)),
        sfsMarginCost: Number(parseFloat(sfsMarginCost / exchangeRates).toFixed(2)),
        uaeTaxesFee: Number(parseFloat(uaeTaxesFee / exchangeRates).toFixed(2)),
        finalPrice: Number(parseFloat(finalPrice / exchangeRates).toFixed(2)),
        inventoryFee,
        inventoryFeeByWeight,        
        marginPercentage,
        variation,
        fixedHanlingFees,
        pickupLogistic,
        partnerFreightCost,
        is_domestic
      }
    } else {  // international products
      // inventory fee
      inventoryFee = ( fixedHanlingFees + pickupLogistic + partnerFreightCost ) / stock.available; // H = (X+Y+Z) / S
      inventoryFeeByWeight = inventoryFee * weight; // I = H * Buyer's Quantity

      if (owner.incoterms === '5cbf6900aa5dbb0733b05be4') { // exworks
        if (fish.descriptor !== null) {
          sfsMargin = fish.descriptor.exworks;
          marginPercentage = fish.descriptor.exworks;
        } else if (fish.type.hasOwnProperty('exworks')) {
          sfsMargin = fish.type.exworks;
          marginPercentage = fish.type.exworks;
        }
      } else if (owner.incoterms === '5cf1a5a11a36d4acacdb22b9') { // FCA
        if (fish.descriptor !== null) {
          sfsMargin = fish.descriptor.exworks;
          marginPercentage = fish.descriptor.exworks;
        } else if (fish.type.hasOwnProperty('exworks')) {
          sfsMargin = fish.type.exworks;
          marginPercentage = fish.type.exworks;
        }
      } else if (owner.incoterms === '5cbf68f7aa5dbb0733b05be3') { // CIP
        if (fish.descriptor !== null) {
          sfsMargin = fish.descriptor.cpi;
          marginPercentage = fish.descriptor.cpi;
        } else if (fish.type.hasOwnProperty('cpi')) {
          sfsMargin = fish.type.cpi;
          marginPercentage = fish.type.cpi;
        }
      } else if (fish.type.hasOwnProperty('exworks')) {
        sfsMargin = fish.type.exworks;
        marginPercentage = fish.type.exworks;
      }

      // getting fish shipping fee
      let shippingFees = await sails.helpers.shippingFee(fish, weight, currentAdminCharges); //B

      //calculate cost using seafoodsouq formula
      let fishCost = Number(parseFloat(fishPrice * weight).toFixed(2)); // A

      let sfsMarginCost = Number(parseFloat((sfsMargin / 100) * fishCost).toFixed(2) ) ; // D= SFS Fee A //calculated from the total amount of the the product sales excluding shipping fees and taxes.
      let customsFee = currentAdminCharges.selectedCustoms; //E= Customs rate * A  //Customs in the UAE are 5% on the Seller’s invoice (The seller’s Sale excluding additional Costs
      if (!is_flat_custom) { // if is not flat custom then we use the percentaje;
        customsFee = Number(parseFloat((currentAdminCharges.selectedCustoms / 100) * fishCost).toFixed(2));
      }
      
      let exchangeRateCommission = Number(parseFloat((fishCost + shippingFees.firstMileFee) * (currentAdminCharges.exchangeRateCommission / 100)).toFixed(2));
      let uaeTaxesFee = Number(parseFloat((fishCost + shippingFees.shippingCost + customsFee + sfsMarginCost + inventoryFeeByWeight) * (currentAdminCharges.uaeTaxes / 100)).toFixed(2)); //F = (A+C+D+E) Tax // MREC  adding inventory fee taxable inventoryFeeByWeight
      let finalPrice = Number(parseFloat(fishCost + exchangeRateCommission + shippingFees.shippingCost + sfsMarginCost + customsFee + uaeTaxesFee + inventoryFeeByWeight).toFixed(2));

      if (inputs.in_AED) {
        exchangeRates = 1;
      } else {
        variation.price = Number(parseFloat(variation.price / exchangeRates).toFixed(2));
      }
  
      //returning json
      charges = {
        price: Number(parseFloat(fishPrice / exchangeRates).toFixed(2)),
        weight: Number(parseFloat(weight).toFixed(2)),
        sfsMargin: Number(parseFloat(sfsMargin).toFixed(2)),
        shipping: Number(parseFloat(shipping / exchangeRates).toFixed(2)),
        customs: Number(parseFloat(currentAdminCharges.selectedCustoms).toFixed(2)),
        uaeTaxes: Number(parseFloat(currentAdminCharges.uaeTaxes).toFixed(2)),
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
        inventoryFee,
        inventoryFeeByWeight,   
        marginPercentage,
        variation,
        fixedHanlingFees,
        pickupLogistic,
        partnerFreightCost,
        is_domestic        
      }
    } // end international product
    
    

    // All done.
    return exits.success(charges);

  }


};

