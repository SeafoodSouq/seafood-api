
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


  friendlyName: 'Fix rased treatment',


  description: '',


  fn: async function () {

    sails.log('Running custom shell script... (`sails run fix-rased-treatment`)');

    // let's fix the raised
    let fishTypes = await FishType.find();

    await Promise.all( fishTypes.map( async type => {
      let fishes = await Fish.find( { type: type.id } );
      let raised = [];
      let treatment = [];

      fishes.map( fish => {
        if ( !raised.includes( fish.raised ) ) {
          raised.push( fish.raised );
        }
        if( !treatment.includes( fish.treatment ) ) {
          treatment.push( fish.treatment );
        }

      } )
	console.log( 'raised', { id: type.id, raised, treatment } );
      await FishType.update( { id: type.id } ).set( { raised, treatment } )
    } ) )

  }


};

