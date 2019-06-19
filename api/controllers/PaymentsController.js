/**
 * PaymentsController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  getAuthorization: async (req, res) => {
    let params = req.body;
    try {
      console.log( params );
      let data = {
          response: params,
          type: params.service_command ,
          shoppingCart: params.shoppingCart
      };

      let payment = await Payments.create( data ); 
      res.status(200).json( params );  
    } catch (error) {
      res.status(500).json( {error, params});
    }
    

  },

  askForAuthorization: (req, res) => {
    const axios = require('axios');

    var mydata = {
      "command": req.param('command'),
      "access_code": req.param('access_code'),
      "merchant_identifier": req.param('merchant_identifier'),
      "merchant_reference": req.param('merchant_reference'),
      "currency": req.param('currency'),
      "language": req.param('language'),
      "token_name": req.param('token_name'),
      "signature": req.param('signature'),
      /*"settlement_reference": req.param('settlement_reference'),*/
      "customer_email": req.param('customer_email'),
      "amount": req.param('amount'),
      "order_description": req.param('order_description'),      
      "customer_ip": req.param("customer_ip")
    };

    let url	 = "https://sbpaymentservices.payfort.com/FortAPI/paymentApi"; //dev
    url = 'https://paymentservices.payfort.com/FortAPI/paymentApi'; //live
    console.log( 'ask for auto' ,mydata );
    axios.post( url, mydata, { 'Content-Type': 'application/json', 'cache-control': 'no-cache' }  )
    .then(function (response) {
      //console.log('res',response);
      res.status(200).json(response.data)
    })
    .catch(function (error) {
      //console.log(error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        //console.log(error.response.data);
        //console.log(error.response.status);
        //console.log(error.response.headers);
      res.status(200).send(error.data)
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        //console.log(error.request);
      res.status(200).send(error.request)
      } else {
        // Something happened in setting up the request that triggered an Error
        //console.log('Error', error.message);
        res.status(200).send(error);
      }
      console.log(error.config);
    });
  }
};

