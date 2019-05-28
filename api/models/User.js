/**
 * User.js
 *
 * A user who can log in to this application.
 */

module.exports = {

  attributes: {

    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    email: {
      type: 'string',
      required: true,
      unique: true,
      isEmail: true,
      maxLength: 200,
      example: 'carol.reyna@microsoft.com'
    },

    firstName: {
      type: 'string',
      required: true,
      description: 'Full representation of the user\'s name',
      maxLength: 120,
      example: 'Lisa Microwave'
    },

    lastName: {
      type: 'string',
      required: true,
      description: 'Full representation of the user\'s name',
      maxLength: 120,
      example: 'Lisa Microwave'
    },

    code: {
      type: 'string',
      required: false,
      description: 'para verificar el correo del usuario',
      maxLength: 6,
      example: 'xdC232'
    },

    verified: {
      type: 'boolean',
      required: true,
      description: 'para guardar si un correo ha sido '
    },

    password: {
      type: 'string',
      required: true,
      description: 'Securely hashed representation of the user\'s login password.',
      protect: true,
      example: '2$28a8eabna301089103-13948134nad'
    },

    role: {
      type: 'number',
      required: true,
      description: `
        0 para admin,
        1 para usuarios vendedor
        2 para comprador
      `,
      example: `
        role : {
          name: "seller",
          company: "idCompany"
        }
      `
    },

    dataExtra: {
      type: "json",
      required: true,
      description: `
        se guardan datos extras que pertenecen a un vendedor, comprador y admin.
      `
    },

    verfication: {
      type: "boolean",
      required: false
    },

    status: {
      type: "string",
      required: false
    },

    denialMessage: {
      type: 'string',
      required: false
    },

    denialType: {
      type: 'number',
      required: false,
      description: `1- Contact in the Future
                    2- Never Contact Again`
    },
    
    logoCompany: {
      type: "string",
      required: false
    },
    
    firstMileCost: {
      type: "number"
    },
    
    

    contactID: {
      type: 'string',
      required: false,
      description: 'id for xero'
    },

    bankName: {
      type: 'string',
      required: false
    },

    bankBranch: {
      type: 'string',
    },

    bankAddress: {
      type: 'string'
    },

    typeBusiness: {
      type: 'string',
      required: false
    },

    //  ╔═╗╔╦╗╔╗ ╔═╗╔╦╗╔═╗
    //  ║╣ ║║║╠╩╗║╣  ║║╚═╗
    //  ╚═╝╩ ╩╚═╝╚═╝═╩╝╚═╝
    // n/a

    //  ╔═╗╔═╗╔═╗╔═╗╔═╗╦╔═╗╔╦╗╦╔═╗╔╗╔╔═╗
    //  ╠═╣╚═╗╚═╗║ ║║  ║╠═╣ ║ ║║ ║║║║╚═╗
    //  ╩ ╩╚═╝╚═╝╚═╝╚═╝╩╩ ╩ ╩ ╩╚═╝╝╚╝╚═╝
    // n/a
    
    incoterms: {
      model: 'incoterms',
      required: false,
      description: `posible options: 
                    -cip
                    -ex-works`
    },
  },
  customToJSON: function () {
    var obj = this;
    delete obj.password;
    return obj;
  },
};
