/**
 * PricingChargesController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {

    getCurrentPricingCharges: async(req, res) => {
        try{            
            let data = await sails.helpers.currentCharges();
            
            res.status(200).json( data );

        }catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getPricingChargesHistory: async(req, res) => {
        try{
            let customs = await PricingCharges.find( { where: { type: 'customs' } } ).sort( 'updatedAt DESC' );

            let flatCustoms = await PricingCharges.find( { where: { type: 'flatCustoms' } } ).sort( 'updatedAt DESC' );

            let lastMileCost = await PricingCharges.find( { where: { type: 'lastMileCost' } } ).sort( 'updatedAt DESC' );

            let uaeTaxes = await PricingCharges.find( { where: { type: 'uaeTaxes' } } ).sort( 'updatedAt DESC' );

            let handlingFees = await PricingCharges.find( { where: { type: 'handlingFees' } } ).sort( 'updatedAt DESC' );
            
            let exchangeRates = await PricingCharges.find( { where: { type: 'exchangeRates' } } ).sort( 'updatedAt DESC' );

            let exchangeRateCommission = await PricingCharges.find( { where: { type: 'exchangeRateCommission' } } ).sort( 'updatedAt DESC' );
            
            let data = {
                "flatCustoms": flatCustoms,
                "customs": customs,
                "lastMileCost": lastMileCost,
                "uaeTaxes": uaeTaxes,
                "handlingFees": handlingFees,
                "exchangeRates": exchangeRates,
                "exchangeRateCommission": exchangeRateCommission
            }
            
            res.status(200).json( data );

        }catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getFishPricingCharges: async( req, res ) => {
        try {
            let fishID = req.param('id');
            let currentCharges = await sails.helpers.currentCharges();

            let fish = await Fish.findOne( { where: { id: fishID } } ).populate("type").populate("store");

            let seller = await User.find( { where: { id: fish.store.owner } } ).limit(1)

            let data = {
                "firstMileCost": seller[0].firstMileCost,
                "lastMileCost": currentCharges.lastMileCost,                
                "uaeTaxes": currentCharges.uaeTaxes,
                "customs": currentCharges.customs,
                "flatCustoms": currentCharges.flatCustoms,
                "sfsMargin": fish.type.sfsMargin,
                "handlingFees": currentChargesprice,
                "exchangeRates": currentCharges.exchangeRates,
                "exchangeRateCommission": currentCharges.exchangeRateCommission
            }

            res.status(200).json( data );

        } catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

};

