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
module.exports = {


  friendlyName: 'Update category count',


  description: '',


  inputs: {

  },


  fn: async function (inputs, exits) {

    sails.log('Running custom shell script... (`update-category-count`)');
    await sails.helpers.updateCategoryCount();
    // All done.
    return exits.success();

  }


};

