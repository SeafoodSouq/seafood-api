module.exports = {


  friendlyName: 'Format date',


  description: '',


  inputs: {
    date:{
      type: "ref",
      required: true
    },
    format:{
      type: "string",
      required: false,
      description: `format to style of moment -> https://momentjs.com/docs/#/parsing/string-format/`
    }
  },


  exits: {
    outputType:{
      result: "ref"
    }
  },


  fn: async function (inputs, exits) { console.log(inputs);
    if(inputs.isDefined('format') === true){
      let format = require("moment")(inputs.date).format(inputs.format);
      return exits.success(format);
    }
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    let formatDate = inputs.date.toLocaleDateString("en-US", options);    
    // All done.
    return exits.success(formatDate);

  }


};

