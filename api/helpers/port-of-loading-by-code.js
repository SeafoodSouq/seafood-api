module.exports = {


  friendlyName: 'Port of loading by code',


  description: ' return Port of loading name(city)',


  inputs: {
	country_code: { type: 'string' },
	city_code: { type: 'string' }
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: async function (inputs, exits) {
    let country_code = inputs.country_code;
    let city_code = inputs.city_code;

    let country = await Countries.findOne( { code: country_code } );

    country.cities.map( city => { 
	if ( city.code == city_code ) {
          return exits.success( city );
	}
    } )

  }


};

