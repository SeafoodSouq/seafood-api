/**
 * ShippingRatesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    getShippingRate: async (country, weight) => {
        try {
            shippingRate = 0;
            shipping = await ShippingRates.find( { sellerCountry: country } )
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
                console.log( shippingRate );
                return shippingRate;
            }
            catch (e) {
                console.error(e);
                res.serverError(e);
            }
    },
    getShippingRateByCities: async (city, weight) => {
        try {
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
                return shippingRate;
            }
            catch (e) {
                console.error(e);
                res.serverError(e);
            }
    },
    getShippingRateByWeight: async(req, res) => {
        try{
            let shippingRate = await module.exports.getShippingRate(req.params["country"], req.params["weight"])
            if( shippingRate )
                res.status(200).json( { "price": shippingRate, "type": "AED" } );
            else
                res.status(200).json( { "message": "No Shipping Rate Found" } );

        }catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getCitiesShippingRateByWeight: async(req, res)=> {
        try {
            //let countries = JSON.parse( req.body['countries'] );
            let cities = JSON.parse( req.body['cities'] );
            let weight = req.body['weight'];
            let rates = [];

            const start = async () => {
                await asyncForEach(cities, async (city) => {
                  let cost = await module.exports.getShippingRateByCities( city , weight );
                  rates.push( { "city": city, "cost":  cost } );
                });
                
                console.log('Done');

                console.log( rates );
                res.status(200).json( rates );
              }
            
            start();
        }catch(e){
            res.serverError(e);
        }
    },
    getShippingRateByCity: async( req, res )=> {
        try {
            let city = req.body['cities'];
            let weight = req.body['weight'];
    
            let cost = await module.exports.getShippingRateByCities( city , weight );
    
            res.status( 200 ).json( cost );
        
        } catch (error) {
            res.status( 400 ).json( error );
        }
        
    },
    getCountriesShippingRateByWeight: async(req, res) => {
        try{
            let countries = JSON.parse( req.body['countries'] );
            let weight = req.body['weight'];
            let rates = [];

            const start = async () => {
                await asyncForEach(countries, async (country) => {
                  let cost = await module.exports.getShippingRate( country , weight );
                  rates.push( { "country": country, "cost":  cost } );
                });
                
                console.log('Done');

                console.log( rates );
                res.status(200).json( rates );
              }
            
            start();

            //if( countries )
                //res.status(200).json( countries );
            //else
                //res.status(200).json( { "message": "No Shipping Rate Found" } );

        }catch (e) {
            res.serverError(e);
        }
    },
    getCountryWithShippings: async (req, res) => {
        try {
            var db = ShippingRates.getDatastore().manager;
            var shippingRates = db.collection(ShippingRates.tableName);

            let countries = await new Promise((resolve, reject) => {
                shippingRates.distinct("sellerCountry", {},
                    function (err, docs) {
                        if (err) {
                            return reject(err);
                        }
                        if (docs) {
                            resolve(docs);
                        }
                    })
            });

            let countriesWithShippingRates = await Countries.find( { code: countries } ).sort( [{ name: 'ASC' }] )


            res.json(countries.sort());
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getCountriesWithShippings: async (req, res) => {
        try {
            var db = ShippingRates.getDatastore().manager;
            var shippingRates = db.collection(ShippingRates.tableName);

            let countries = await new Promise((resolve, reject) => {
                shippingRates.distinct("sellerCountry", {},
                    function (err, docs) {
                        if (err) {
                            return reject(err);
                        }
                        if (docs) {
                            resolve(docs);
                        }
                    })
            });

            let countriesWithShippingRates = await Countries.find( { code: countries } ).sort( [{ name: 'ASC' }] )


            res.v2( countriesWithShippingRates );
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getCitiesWithShippings: async (req, res) => {
        try {
            let country = req.params['country'];
            var db = ShippingRates.getDatastore().manager;
            var shippingRates = db.collection(ShippingRates.tableName);

            let countries = await new Promise((resolve, reject) => {
                shippingRates.distinct("sellerCity", { sellerCountry: country  },
                    function (err, docs) {
                        if (err) {
                            return reject(err);
                        }
                        if (docs) {
                            resolve(docs);
                        }
                    })
            });


            res.json(countries.sort());
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    }
};

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }