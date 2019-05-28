module.exports = {


  friendlyName: 'Shipping by city',


  description: 'Get the shipping rate for the city (port of loading) and weight. The shipping rate is returned in AED',


  inputs: {
    city: {
      type: 'string'
    },
    weight: {
      type: 'number'
    }
  },


  exits: {
    outputType:{
      result: "number"
    }
  },


  fn: async function (inputs, exits) {
    try {
      let city = inputs.city;
      let weight = inputs.weight;
      shippingRate = 0;
      shipping = await ShippingRates.find( { sellerCity: city } )
          .sort( [{ weight: 'ASC' }] )
          .then( 
              result => {
                  var BreakException = {};
                  try {
                      let resultSize = Object.keys(result).length ;
                      let resultCount = 0;
                      result.forEach( row => {
                          resultCount +=1 ;
                          if( weight < row.weight  ){                                    
                              shippingRate = row.cost;
                              throw BreakException;
                          }else {
                              if( resultCount == resultSize ){
                                  shippingRate = row.cost;
                                  throw BreakException;
                              }
                          }
                          
                          
                      });
                      //shippingRate = shippingRate;
                  } catch (e) {
                      
                      return shippingRate;
                      if (e !== BreakException) throw e;
                  }
                  
              },
              error => {
                  console.log(error);
              }
          )
          return exits.success(shippingRate);
      }
      catch (e) {
          console.error(e);
          return e;
      }
    // All done.
  }
};

