global.catchErrors = callback => {

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

//add function to prototype Object
//pienso que el helpers, no es la mejor opcion para usar functiones globales siempre y cuando
//no sean functions async/await y no tengan que interectuar con base de datos y no controllers
//porque necesita formalizar variables y necesitas llamar la function usando el object sails

/*********
 * Para saber el tipo de objecto
 * 
 * response: string, number, array, object...
 */
Object.defineProperty(Object.prototype, 'typeObject', {
    value: function() {
        return Object.prototype.toString.call(this).split(" ")[1].replace("]", "").toLowerCase();
    },
    enumerable: false
});

Object.defineProperty(Object.prototype, 'isDefined', {
    value: function(attribute) {
        return this[attribute] !== null && this[attribute] !== undefined;
    },
    enumerable: false
});

console.log("load globals")