const propMap = function (obj, byPass) {

  let procsProp = function (prop) {
    if (prop === null || prop === undefined) return prop;
    if (prop.typeObject() === 'array' || prop.typeObject() === 'object') {
      prop = propMap(prop);
    } else if (isNaN(prop) === false && prop !== "") {
      prop = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(prop);
    }
    return prop;
  }

  let isByPass = (name) => {
    return byPass.findIndex(it => {
      return it === name;
    }) !== -1;   
  };

  if (obj.typeObject() === "array") {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = procsProp(obj[i]);
    }
  }

  if (obj.typeObject() === 'object') {
    let names = Object.keys(obj);
    for (let name of names) {
      if(isByPass(name) === false)
        obj[name] = procsProp(obj[name]);
    }
  }

  return obj;
};

module.exports = {


  friendlyName: 'Prop map',


  description: `Para recorrer todas las propiedades de un objecto 
    y convertir las propiedades numericas, en propiedades en cadenas de tecto 
    representando numeros con dos decimales
  `,

  sync: false,

  inputs: {
    prop: {
      type: "ref",
      required: true
    },
    byPass: {
      type: "ref",
      required: false
    },
  },


  exits: {

    success: {
      description: 'All done.',
    },

  },


  fn: function (inputs, exits) {
    // TODO
    //si mantengo la referencia puede afectar en calculos 
    //como en los pdf
    let prop = JSON.parse(JSON.stringify(inputs.prop));
    let byPass = inputs.byPass || [];
    return exits.success(propMap(prop, byPass));

  }


};

