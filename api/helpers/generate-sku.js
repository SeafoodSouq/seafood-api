module.exports = {


  friendlyName: 'Generate sku',


  description: '',


  inputs: {

  },


  exits: {
    outputType:{
      result: "ref"
    }
  },


  fn:  function (inputs, exits) {

    // All done.
    return exits.success("seafood_sku_test_");

  }


};

