module.exports = {


  friendlyName: 'Current charges',


  description: 'Get Current charges manage by the admin',


  inputs: {

  },


  exits: {
    outputType:{
      result: "ref"
    }
  },


  fn: async function (inputs, exits) {
    try {
      
      let types = [ 'flatCustoms','customs', 'lastMileCost', 'uaeTaxes', 'handlingFees', 'exchangeRates', 'exchangeRateCommission' ];

      let data = {};
      await Promise.all( types.map( async ( type ) => {
        let value = await PricingCharges.find( { where: { type } } ).sort( 'updatedAt DESC' ).limit(1);
        console.log( value );
        data[type] = value[0].price;
      })
      )
      return exits.success(data);
    } catch (error) {
        return  exits.success(error);
    }
   
  }


};

