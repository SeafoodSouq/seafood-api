const sails = require('sails');
var options = {};
var normalizedPath = require("path").join(__dirname, "./config");

require("fs").readdirSync(normalizedPath).forEach(function (file) {
    if (file.includes(".js")) {
        let name = file.split(".js")[0];
        if (name !== "local")
            options[name] = require("./config/" + file)[name];
        else
            options[name] = require("./config/" + file);
    }
});

//Windows tengo problemas para setear variables
process.env.NODE_ENV = "test";
module.exports = async function () {
    //load globals
    require("./globals.js");

    await new Promise((resolve, reject) => {
        sails.lift(options, err => {
            try {
                if (err) return reject(err);
                resolve(sails)
            } catch (e) {
                console.error(e);
                reject(e);
            }
        });
    });

}