module.exports = {


  friendlyName: 'Is defined',


  description: 'Para comprobar si un existe una propiedad en un objecto',


  inputs: {
    prop: {
      type: "ref",
      description: "este es el objeto donde se busca la propiedad",
      required: true
    },
    name: {
      type: "string",
      description: "nombre del atributo",
      required: true
    }
  },


  exits: {

  },


  fn: function (inputs, exits) {
    if (inputs.prop[inputs.name] !== undefined && inputs.prop[inputs.name] !== null){
      return exits.success(true);
    }
    
    return exits.success(false);
  }


};

