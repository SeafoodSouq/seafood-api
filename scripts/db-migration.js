
catchErrors = callback => {

  return async function (req, res) {
      try {
          await callback(req, res);
      }
      catch (e) {
          sails.log("error", e);
          console.error(e);
          res.serverError();
      }
  }

};
Object.defineProperty(Object.prototype, 'typeObject', {
  value: function() {
      return Object.prototype.toString.call(this).split(" ")[1].replace("]", "").toLowerCase();
  },
  enumerable: false
});

Object.defineProperty(Object.prototype, 'isDefined', {
  value: function(attribute) {
      return this[attribute] !== null && this[attribute] !== undefined;
  },
  enumerable: false
});

module.exports = {

  friendlyName: 'Db migration',


  description: 'here we check if the database has the records needed for start working',


  fn: async function () {

    sails.log('Running custom shell script... (`sails run db-migration`)');

    let fishes = await Fish.find().populate('type');
    let newFishVariations = [];
    await Promise.all( fishes.map( async fish => {
      let categorySetup = {
        unitOfMeasure: fish.type.unitOfSale !== undefined ? fish.type.unitOfMeasure :  '',
        raised: fish.type.raised !== undefined ? fish.type.raised : [],
        treatment: fish.type.treatment !== undefined ? fish.type.treatment : [],
        fishPreparation: fish.type.fishPreparation !== undefined ? fish.type.fishPreparation : {}
      }

      // let's check the unit of measure
      if( categorySetup.unitOfMeasure === '' ) { // if not founded, let's use the one in the fish
        if( fish.unitOfSale == undefined || fish.unitOfSale == null || !fish.hasOwnProperty('unitOfSale') || fish.unitOfSale == '' )  {
          await Fish.update( { id: fish.id } ).set( { unitOfSale: 'kg' } )
          fish['unitOfSale'] = 'kg';
        }
        //console.log( fish.unitOfSale );
        let unitOfMeasureFound = await UnitOfMeasure.find( { name: fish.unitOfSale } ).limit(1);
        if( unitOfMeasureFound.length > 0 ) {
          categorySetup.unitOfMeasure = unitOfMeasureFound[0].name;
        }
      }

      // check if raised is there
      if( !categorySetup.raised.includes( fish.raised ) ) {       
        categorySetup.raised.push( fish.raised );
      }

      // check if treatment is there
      if( !categorySetup.treatment.includes( fish.treatment ) ) {
        categorySetup.treatment.push( fish.treatment );
      }

      // check if fishPreparation is there
      // first let's look for the variations of this fish

      let variations = await Variations.find( { fish: fish.id } ).populate('fishPreparation')
      
      await Promise.all( variations.map( async variation => {
        let isParentFishPreparationAlreadyInSetup = false;
        let isFishPreparationAlreadyInSetup = false;
        // let iterate each fishPreparation in the setup                
        Object.keys( categorySetup.fishPreparation ).forEach(function(key) {
          if( key == variation.fishPreparation.parent ) {
            isParentFishPreparationAlreadyInSetup = true;

            // let's see if the child preparation is in the setup
            if( !categorySetup.fishPreparation[key].includes( variation.fishPreparation.id ) ) {
              categorySetup.fishPreparation[key].push( variation.fishPreparation.id );
            }
          }
          //console.table('Key : ' + key + ', Value : ' + data[key])
        })

        // if the parentCategory is no there, let's added with the child preparation too
        if( !isParentFishPreparationAlreadyInSetup ) {
          categorySetup.fishPreparation[ variation.fishPreparation.parent ] = [ variation.fishPreparation.id ]
        }

        // if is filleted or trim wholeFishWeight is going to be null so let's insert and  put same child preparation
        if( typeof variation.wholeFishWeight !== 'string' || variation.wholeFishWeight == null || variation.wholeFishWeight == undefined || variation.wholeFishWeight == '' )  {
          //look for the child in whole fish weight
          let childPrep = await FishPreparation.findOne({ id: variation.fishPreparation.id });
          let fishVar = await WholeFishWeight.findOne({ name: childPrep.name })
          if( typeof fishVar !== 'object' || fishVar == null ) { // not exists so let's created
            fishVar = await WholeFishWeight.create({ name: childPrep.name, isActive: true }).fetch();
          }
        variation.wholeFishWeight = fishVar.id;
        // now lets update the id of the trim or package
        await Variation.update( { id: variation.id } ).set( { wholeFishWeight: fishVar.id } )
        }
        
        // now let's look for the variations (wholefishweight)
        //let variationExists = await FishVariations.findOne( { fishType: fish.type.id, fishPreparation: variation.fishPreparation.id } )

        //console.log('exists', variationExists);
          // if variation not exists, let's create it
        if( variation.wholeFishWeight !== null ){
          let newFishVariationExist = false;
          newFishVariations.map( (newFishVariation, newFishVariationIndex) => {
            if( newFishVariation.fishType == fish.type.id && newFishVariation.fishPreparation == variation.fishPreparation.id ){
              if( !newFishVariations[newFishVariationIndex].variations.includes( variation.wholeFishWeight ) ) {
                newFishVariations[newFishVariationIndex].variations.push( variation.wholeFishWeight )
                newFishVariationExist = true;
              }
            } 
          } )
          if ( !newFishVariationExist ) {
            newFishVariations.push( { fishType: fish.type.id, fishPreparation: variation.fishPreparation.id, variations: [ variation.wholeFishWeight ] } );
            
          }


          /*if( typeof variationExists !== 'object' || variationExists == null ) {
            await FishVariations.create( { fishType: fish.type.id, fishPreparation: variation.fishPreparation.id, variations: [ variation.wholeFishWeight ] } )
            console.log( 'inserted' )
          } else {
            console.log( 'updated' );
            // the fish has variations, but let's check if it have the current one
            if( !variationExists.variations.includes( variation.wholeFishWeight ) ) {
              variationExists.variations.push( variation.wholeFishWeight );
              await FishVariations.update( { id: variationExists.id } ).set( { variations: variationExists.variations } )
            }
          }*/
        }
        return Promise.resolve('ok');
      } ) )
      //console.log('--------------------------------------------------------------------------');
      //console.log( 'beforeSetup', categorySetup );
      await FishType.update({ id: fish.type.id }).set( categorySetup );
      return Promise.resolve('ok');
    } ) );
    
    //console.log('fish variations', newFishVariations );
    //let's fix newFishVariations array
    let newArray = [];
    newFishVariations.map( fishVariation => {
      let newVariationExists = false;
      newArray.map( (item, newArrayIndex ) =>  {
        if( fishVariation.fishPreparation == item.fishPreparation && fishVariation.fishType == item.fishType ) {
          newVariationExists = true;
          fishVariation.variations.map( variation => {
            if( !item.variations.includes( variation ) ) {
              newArrayIndex[newArrayIndex].push( variation );
            }
          } ) 
        }
      } )
      if( !newVariationExists ){
        newArray.push( { fishPreparation: fishVariation.fishPreparation, fishType: fishVariation.fishType, variations: fishVariation.variations } )
      }
    } )

    await Promise.all( newArray.map( async newVariation => {
      await FishVariations.create( newVariation )
    } ) )
    

  }


};

