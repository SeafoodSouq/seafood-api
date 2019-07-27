
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


  friendlyName: 'Basic info migration',


  description: '',


  fn: async function () {

    sails.log('Running custom shell script... (`sails run basic-info-migration`)');

    //adding basic unit of measure
    let unitOfMeasureFound = await UnitOfMeasure.find({});

    if( unitOfMeasureFound.length == 0 ) {      
      await UnitOfMeasure.create({
        name: "kg",
        kgConversionRate: 1,
        isActive: true
      })
      await UnitOfMeasure.create({
        name: "lbs",
        kgConversionRate: 0.453592,
        isActive: true
      })
      await UnitOfMeasure.create({
        name: "grams",
        kgConversionRate: 0.001,
        isActive: true
      })
    }

    let fishes = await Fish.find().populate('type');
    await Promise.all( fishes.map( async fish => {
      let categorySetup = {
        unitOfMeasure: fish.type.unitOfSale !== undefined ? fish.type.unitOfMeasure :  '',        
      }

      // let's check the unit of measure
      if( categorySetup.unitOfMeasure === '' ) { // if not founded, let's use the one in the fish
        if( fish.unitOfSale == undefined || fish.unitOfSale == null || !fish.hasOwnProperty('unitOfSale') || fish.unitOfSale == '' )  {
          await Fish.update( { id: fish.id } ).set( { unitOfSale: 'kg' } )
          fish['unitOfSale'] = 'kg';
        } else {
          await Fish.update( { id: fish.id } ).set( { unitOfSale: fish.unitOfSale.toLowerCase() } )
        }     
      }
    }));

    // let set all basic info as active
    await Raised.update({}).set({ isActive: true });
    await Treatment.update({}).set({ isActive: true });
    await FishPreparation.update({}).set({ isActive: true });
    await UnitOfMeasure.update({}).set({ isActive: true });
    await WholeFishWeight.update({}).set({ isActive: true });

    await FishPreparation.update( { name: ['Filleted', 'Whole', 'Packaged'] } ).set( { parent: "0" } );
    await FishPreparation.update( { name: ['Head Off Gutted', 'Head On Gutted'] } ).set( { parent: "5d128316ce26cbab9c23e52e" } );
    

    
    await Promise.all( unitOfMeasureFound.map( async unit => {
      
      if(unit.kgConversionRate == undefined || unit.kgConversionRate == null || !unit.hasOwnProperty('kgConversionRate') ) {
        if( unit.name === "lbs" ) 
          unit['kgConversionRate'] = 0.4535;
        else if ( unit.name === 'grams' )
          unit['kgConversionRate'] = 0.001;
        else 
          unit['kgConversionRate'] = 1;
        
        await UnitOfMeasure.update({ id: unit.id }, { kgConversionRate: unit.kgConversionRate });
      } 
    } ) )

    //add parent category for fillete fishpreparation
    
    //fillete and package
    let fillete = await FishPreparation.findOne( { id: '5c93c01465e25a011eefbcc4', parent: '0' } );
    let package = await FishPreparation.findOne( { id: '5d1cc9cd29dc5790fa2537f3', parent: '0' } );
    let whole = await FishPreparation.findOne( { id: '5d128316ce26cbab9c23e52e', parent: '0' } );

    if( fillete ){
      // creating the parent for the current fillete
      let parentFillete = await FishPreparation.create( {
        "name" : "Filleted",
        "isTrimming" : false,
        "defaultProccessingParts" : null,
        "parent" : "0",
        "identifier" : "filleted_parent",
        "isActive" : true
      } ).fetch();
      // update fillete with the parent what we just create
      await FishPreparation.update( { id: fillete.id } ).set( { parent: parentFillete.id } );
      await FishPreparation.update( { parent: fillete.id } ).set( { parent: parentFillete.id } );
      await FishPreparation.update( { name: { contains: 'Trim' } } ).set( { parent: parentFillete.id } );
    }

    if( whole ){
      let parentWhole = await FishPreparation.create( {
        "name": "Whole",
        "isTrimming" : false,
        "defaultProccessingParts" : null,
        "parent" : "0",
        "identifier" : "whole_parent",
        "isActive" : true
      } )
      await FishPreparation.update( { id: whole.id } ).set( { parent: parentWhole.id } );
      await FishPreparation.update( { parent: whole.id } ).set( { parent: parentWhole.id } );
    }

    if( package ) {
      let parentPackage = await FishPreparation.create( {
        "name" : "Package",
        "isTrimming" : false,
        "defaultProccessingParts" : null,
        "parent" : "0",
        "identifier" : "package_parent",
        "isActive" : true
      } ).fetch();
      // update fillete with the parent what we just create
      await FishPreparation.update( { id: package.id } ).set( { parent: parentPackage.id } );
      await FishPreparation.update( { parent: package.id } ).set( { parent: parentPackage.id } );
    }


    //let's add variations for trims and packages
    let fishPreparations = await FishPreparation.find({ parent: { '!=': "0" } });
    await Promise.all( fishPreparations.map( async preparation => {
      await WholeFishWeight.findOrCreate( { name: preparation.name }, { name: preparation.name, isActive: true } )
    } ) )

  }


};

