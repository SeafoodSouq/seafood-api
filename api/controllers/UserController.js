const random = require("randomatic"), webappUrl = sails.config.custom.webappUrl
module.exports = {
    verificationCode: async (req, res) => {

        try {
            let id = req.param("id"), code = req.param("code");
            let us = await User.findOne({ id });
            if (us === undefined)
                return res.json({ message: "The code entered is incorrect" });

            if (us.code === code) {
                us = await User.update({ id }, { verification: true }).fetch();
                res.json({ message: "valid", url: webappUrl + '/verification/' + id + "/" + code, user: us });
            } else {
                res.json({ message: "The code entered is incorrect" });
            }

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    resetEmail: async (req, res) => {
        try {
            let email = req.param("email");
            let user = await User.findOne({ email });

            if (user === undefined) {
                return res.status(400).send("user not found");
            }

            let code = random("0", 6);
            let fod = await ForgotPassword.findOne({ valid: false, code });
            console.log(fod);
            while (fod !== undefined) {
                code = random("0", 6);
                fod = await ForgotPassword.findOne({ valid: false, code });
                console.log(fod);
            }

            let forgot = {
                user: user.id,
                code,
                valid: false
            };
            let name = user.firstName + ' ' + user.lastName;
            forgot = await ForgotPassword.create(forgot).fetch();

            //require("./../../mailer").sendEmailForgotPassword(email, forgot.code);
            await MailerService.sendEmailForgotPassword(email, forgot.code, name);
            res.json({ msg: "success" });

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    changePassword: async (req, res) => {
        try {
            let code = req.param("code");
            let forg = await ForgotPassword.findOne({ code, valid: false });
            let moment = require("moment");
            if (forg === undefined) {
                return res.status(400).send("The code entered is incorrect. Please check your reset password email and try again");
            } else if (moment(forg.createdAt).isAfter(moment())) {
                return res.status(400).send("The code entered expired");
            }

            await ForgotPassword.update({ id: forg.id }, { valid: true })
            let password = await sails.helpers.passwords.hashPassword(req.param("password"));
            let user = await User.update({ id: forg.user }, { password, code: '' }).fetch();
            console.log(user);
            res.json({ msg: "success" });
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    updatePassword: async (req, res) => {
        try {
            let email = req.param("email"), password = req.param("password"),
                newPassword = req.param("newPassword");
            let user = await User.findOne({ email });
            if (user === undefined) {
                return res.status(400).send("user not found!");
            }

            await sails.helpers.passwords.checkPassword(password, user.password);

            await User.update({ id: user.id }, {
                password: await sails.helpers.passwords.hashPassword(newPassword)
            });

            res.json({ msg: "success" });
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    sendMessageContact: async (req, res) => {
        try {
            let id = req.param("id"), name = req.param("name"),
                email = req.param("email"), message = req.param("message");

            let user = await User.findOne({ id });
            if (user === undefined) {
                return res.status(400).send("not found");
            }
            let nameSeller = user.firstName + ' ' + user.lastName;
            // await require("./../../mailer").sendDataFormContactToSeller(user.email,name, {
            //     name,
            //     email,
            //     message
            // });
            await MailerService.sendDataFormContactToSeller(user.email, nameSeller, name, email, message);

            res.json({ msg: "success" });
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getAdmins: async (req, res) => {
        try {

            let users = await User.find({ role: 0 });
            users = users.map( user => {
                delete user.token;
                return user;
            } )
            res.json(users);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    deleteUser: async (req, res) => {
        try {

            let imageCtrl = require("./ImageController"),
                id = req.param("id"),
                user = await User.destroy({ id }).fetch();

            if (user.length === 0) {
                return res.status(400).send("not found");
            }

            if (user[0].role === 1) {

                //Eliminamos los store
                let stores = await Store.find({ owner: id });

                //Eliminamos las imagenes de los stores
                //Y los productos y sus imagenes
                for (let store of stores) {
                    if (store.hasOwnProperty("logo") && store.logo !== '') {
                        let dirs = store.logo.split("/");
                        await imageCtrl.deleteImageXDirName(["store", dirs.pop()]);
                    }

                    let fishs = await Fish.destroy({ store: store.id }).fetch();
                    for (let fish of fishs) {
                        console.log(fish);
                        await imageCtrl.deleteImageXDirName([fish.id]);
                        await imageCtrl.deleteImageXDirName(["primary", fish.id]);
                    }
                }

                await Store.destroy({ owner: id });
            }

            res.json({ msg: "success" });
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    updateStatus: async (req, res) => {
        try {

            let id = req.param("id"), status = req.param("status");
            let user = await User.findOne({ id });

            if (user === undefined) {
                return res.status(400).send("not found");
            }
            if (user.status === status) {
                return res.json({ msg: "ready" });
            }

            if (status === "accepted") {
                user = await User.update({ id }, { status }).fetch();
                let name = user[0].firstName + " " + user[0].lastName;
                if (user.length !== 0) {
                    // await require("./../../mailer").sendCode(user[0].id, user[0].email, user[0].code, name);
                    // await MailerService.sendApprovedEmail(user[0].id, user[0].email, user[0].code, name);                     
                    if (user[0].role == 1) {
                        await MailerService.sendApprovedSellerEmail(user[0].email, name);
                    } else {
                        await MailerService.sendApprovedBuyerEmail(user[0].id, user[0].email, user[0].code, name);
                    }
                }
            } else if (status === "denied") {
                console.log('denied');
                let denialMessage = req.body['denialMessage'];
                let denialType = req.body['denialType'];
                user = await User.update({ id }, { status, denialMessage, denialType }).fetch();
                let name = user[0].firstName + " " + user[0].lastName;
                //await require("./../../mailer").sendDenialMessage(user[0].id, user[0].email, denialMessage);
                let rolName = user[0].role === 2 ? 'Buyer' : 'Seller';
                let emailContact = user[0].role === 2 ? 'info@seafoodsouq.com' : 'sellers@seafoodsouq.com';
                if (Number(denialType) === 2) {
                    await MailerService.sendRejectedEmail_Type2(user[0].email, rolName, name, denialMessage, emailContact);
                } else {
                    await MailerService.sendRejectedEmail_Type1(user[0].email, rolName, name, denialMessage, emailContact);
                }
            }
            res.json({ msg: "success" });
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    updateUser: async (req, res) => {
        try {
            let users = await User.find();
            for (let i = 0; i < users.length; i++) {
                users[i].dataExtra.Address = "";
                users[i].dataExtra.City = "";
                users[i].dataExtra.zipCode = "";
                await User.update({ id: users[i].id }, { dataExtra: users[i].dataExtra });
            }

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    emailExist: async (req, res) => {
        try {
            let email = req.param("email");
            let user = await User.findOne({ email });
            if (user === undefined) {
                res.status(200).json({ message: false });
            } else {
                res.status(200).json({ message: true });
            }
        } catch (error) {

        }
    },

    getUsersNotVerfied: async (req, res) => {
        try {
            let users = await User.find({
                where: { status: "" },
                skip: Number(req.param("skip")),
                limit: Number(req.param("limit"))
            });
            let count = await User.count({ status: "" });

            res.json({ users, count });
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getPublicIp: async (req, res) => {
        try {
            var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;


            res.send({ ip });
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    //#region for api v2
    getUsers: async (req, res) => {
        try {
            let where = {}, response = {};
            if (req.param("where")) {
                if (Object.prototype.toString.call(req.param("where")) === '[object String]')
                    where.where = JSON.parse(req.param("where"));
                else if (Object.prototype.toString.call(req.param("where")) === '[object Object]')
                    where.where = req.param("where");
            }

            if (req.param("sort")) {
                where.sort = req.param("sort");
            }

            if (req.param("limit")) {
                where.limit = Number(req.param("limit"));
            }

            if (req.param("page") && where.limit) {
                let skip = (Number(req.param("page")) - 1) * where.limit;
                where.skip = skip;
            }

            if (_.isUndefined(where.limit) === false && _.isUndefined(where.skip) === false) {
                response.totalResults = await User.count({ where: where.where });
                response.datas = await User.find(where);
                response.page = Number(req.param("page"));
                response.limit = where.limit;
                return res.pagination(response);
            }

            response = await User.find(where);
            res.v2(response);

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    }

    //#endregion
};

