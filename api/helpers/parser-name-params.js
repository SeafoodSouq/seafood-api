module.exports = {


  friendlyName: 'Parser name params',


  description: 'toma los nombre en template string dividos por coma y los convierte en array',


  inputs: {
    text:{
      type: "string",
      required: true
    }
  },


  exits: {
    outputType:{
      result: "ref"
    }
  },


  fn: async function (inputs, exits) {
    let parser = inputs.text.split(" ").join("").replace(/(?:\r\n|\r|\n)/g, "").replace(/\n/, "").split(",");
    // All done.
    return exits.success(parser);

  }


};

