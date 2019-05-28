const sharp = require('sharp');
const fs = require("fs");
const path = require("path");
const mmm = require('mmmagic'),
    Magic = mmm.Magic;
const rimraf = require('rimraf');
const isWin = process.platform === "win32";
const DIR = path.join(__dirname, "../../images/store/sfs");
const concatNameVariation = require("./ItemShoppingController").concatNameVariation;

module.exports = {
    save: async (req, res) => {
        try {
            let imageCtrl = require("./ImageController");
            let owner = req.param("owner"), description = req.param("description"),
                location = req.param("location"), name = req.param("name");
            let store = await Store.create({ owner, description, location, name }).fetch();

            store = await imageCtrl.saveLogoStore(req, store.id);

            res.json(store);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getXUser: async (req, res) => {
        try {
            let id = req.param("id");
            console.log({ owner: id });
            let store = await Store.find({ owner: id });
            if (store === undefined) {
                return res.status(400).send('not found');
            }

            res.json(store);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getStoreSimplified: async (req, res) => {
        try {
            let stores = await Store.find();
            stores = stores.map(function (it) {
                return { id: it.id, name: it.name };
            });

            res.json(stores);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getWithTypes: async (req, res) => {
        try {
            let id = req.param("id");
            console.log(id);
            let store = await Store.findOne({ id });
            store.fishs = await Fish.find({ store: store.id }).populate("type").populate("status")

            //fish['variations'] = [];
            await Promise.all(store.fishs.map(async (fish) => {
                let variations = await Variations.find({ fish: fish.id });


                await Promise.all(variations.map(async (variation, index) => {

                    variations[index]['prices'] = await VariationPrices.find({ variation: variation.id });


                }))
                fish['variations'] = variations;
            }))

            res.json(store);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getAllProductsWithTypes: async (req, res) => {
        try {
            let fishs = await Fish.find().populate("type").populate("store")

            res.json(fishs)
        }
        catch (e) {
            console.error(e);
        }
    },

    uploadImagesSFS: async (req, res) => {
        try {
            let id = req.param("id");
            let store = await Store.findOne({ id });
            if (store === undefined) {
                return res.serverError("id not added");
            }

            let dirname = path.join(DIR, id);

            //Si no exite el path, se crea
            if (fs.existsSync(dirname) === false) {
                fs.mkdirSync(dirname)
            }

            // saveSFS_SalesOrderForm(req, res, dirname);

            req.file("sfs").upload({
                dirname,
                maxBytes: 20000000
            }, async function (err, uploadedFiles) {
                console.log("estas");
                if (err) return res.serverError(err);

                let srcs = {
                    SFS_SalesOrderForm: "",
                    SFS_TradeLicense: "",
                    SFS_ImportCode: "",
                    SFS_HSCode: ""
                };
                let i = 0;
                for (let file of uploadedFiles) {
                    if (file["status"] === "finished") {
                        let rs = path.resolve(file.fd);
                        console.log(rs);
                        let nameFile = isWin ? rs.split("\\").pop() : rs.split("/").pop();
                        if (i == 0) {
                            srcs.SFS_SalesOrderForm = "/image/store/sfs/" + nameFile + "/" + req.param("id");
                        }
                        if (i == 1) {
                            srcs.SFS_TradeLicense = "/image/store/sfs/" + nameFile + "/" + req.param("id");
                        }
                        if (i == 2) {
                            srcs.SFS_ImportCode = "/image/store/sfs/" + nameFile + "/" + req.param("id");
                        }
                        if (i == 3) {
                            srcs.SFS_HSCode = "/image/store/sfs/" + nameFile + "/" + req.param("id");
                        }
                        i++;
                    }
                }

                await Store.update({ id }, srcs);

                res.json({ msg: "success" });
            })

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getImageSFS: async (req, res) => {
        try {
            let nameFile = req.param("namefile"), id = req.param("id"),
                dirname = path.join(DIR, id, nameFile);

            let mimeType = await new Promise(function (resolve, reject) {
                var magic = new Magic(mmm.MAGIC_MIME_TYPE);
                magic.detectFile(dirname, function (err, result) {
                    if (err) { return reject(err); };
                    resolve(result);
                });
            });

            if (fs.existsSync(dirname) === true) {
                let data = fs.readFileSync(dirname);
                res.contentType(mimeType);
                res.send(data);
            } else {
                res.serverError("not found");
            }

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    updateImageSFS: async (req, res) => {
        try {
            let sfs = req.param("sfs"), id = req.param("id"); console.log(sfs);
            let d = `
            SFS_SalesOrderForm
            SFS_TradeLicense
            SFS_ImportCode
            SFS_HSCode
            `;
            let store = await Store.findOne({ id });
            if (store === undefined) {
                res.status(400);
                return res.send("not found!");
            }

            let dirname = path.join(DIR, id);

            //Si no exite el path, se crea
            if (fs.existsSync(dirname) === false) {
                fs.mkdirSync(dirname)
            }

            req.file("sfs").upload({
                dirname,
                maxBytes: 20000000
            }, async function (err, uploadedFiles) {
                console.log("estas");
                if (err) return res.serverError(err);


                let src = "";
                for (let file of uploadedFiles) {
                    if (file["status"] === "finished") {
                        let rs = path.resolve(file.fd);
                        console.log(rs);
                        let nameFile = isWin ? rs.split("\\").pop() : rs.split("/").pop();
                        src = "/image/store/sfs/" + nameFile + "/" + req.param("id");
                    }
                }

                let st = {};
                st[sfs] = src;
                await Store.update({ id }, st);

                res.json({ msg: "success" });
            });

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    deleteImageSFS: async (req, res) => {
        try {
            let sfs = req.param("sfs"), id = req.param("id"); console.log(sfs);
            let d = `
            SFS_SalesOrderForm
            SFS_TradeLicense
            SFS_ImportCode
            SFS_HSCode
            `;
            let store = await Store.findOne({ id });
            if (store === undefined) {
                res.status(400);
                return res.send("not found!");
            }

            if (store[sfs]) {
                let url = store[sfs];
                let urlsplit = url.split("/").slice(-2);
                let namefile = urlsplit[0];
                let dirname = path.join(DIR, id, namefile);
                if (fs.existsSync(dirname) === true) {
                    console.log(dirname);
                    fs.unlinkSync(dirname);
                }
                store[sfs] = "";
                delete store["id"];
                console.log(store);
                await Store.update({ id }, store)
            }

            res.json({ msg: "success" })

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getStoreOrders: async (req, res) => {
        let userID = req.param("id");
        let status = req.param("status");
        let store = await Store.find({ where: { owner: userID } });

        if (store === undefined)
            return res.status(400).status("not found");

        let storeIds = [];
        store.map(item => {
            storeIds.push(item.id);
        })

        let storeFishes = await Fish.find({ store: storeIds });
        // end get buyer information

        let storeFishesIds = [];
        storeFishes.map(item => {
            storeFishesIds.push(item.id);
        })

        itemsBuyed = await ItemShopping.find({
            where: {
                fish: storeFishesIds
            }
        });

        let ordersIds = [];
        itemsBuyed.map(item => {
            ordersIds.push(item.shoppingCart);
        })

        let StoreOrders = await ShoppingCart.find({
            where:
            {
                id: ordersIds,
                status: 'paid'
            },
            sort: 'updatedAt DESC'
        }).populate("buyer").populate("items");

        ordersShipped = [];
        ordersNotShipped = [];

        await Promise.all(StoreOrders.map(async order => {
            order.allShipped = true;
            order.items = await Promise.all(order.items.map(async item => {
                itemFish = await Fish.findOne(item.fish);
                item['fish'] = itemFish;
                if (item.status == '5c017ae247fb07027943a404' || item.status == '5c017af047fb07027943a405') {
                    order.allShipped = false;
                }
                item = await concatNameVariation(item);
                return item;
            })
            )
            if (order.allShipped)
                ordersShipped.push(order);
            else
                ordersNotShipped.push(order);
        })
        )

        if (status == 'shipped')
            res.status(200).json(ordersShipped);
        else
            res.status(200).json(ordersNotShipped);
    },
    getStoreOrdersByItemStatus: async (req, res) => {
        let userID = req.param("owner_id");
        let status = req.param("status_id");
        let store = await Store.find({ where: { owner: userID } });

        if (store === undefined)
            return res.status(400).status("not found");

        let storeIds = [];
        store.map(item => {
            storeIds.push(item.id);
        })

        let storeFishes = await Fish.find({ store: storeIds });
        // end get buyer information

        let storeFishesIds = [];
        storeFishes.map(item => {
            storeFishesIds.push(item.id);
        })

        itemsBuyed = await ItemShopping.find({
            where: {
                fish: storeFishesIds
            }
        });

        let ordersIds = [];
        itemsBuyed.map(item => {
            ordersIds.push(item.shoppingCart);
        })

        let StoreOrders = await ShoppingCart.find({
            where:
            {
                id: ordersIds,
                status: 'paid'
            },
            sort: 'updatedAt DESC'
        }).populate("buyer").populate("items");

        let statusOrders = [];

        await Promise.all(StoreOrders.map(async order => {
            order.allShipped = true;
            let shouldGetOrder = false;
            order.items = await Promise.all(order.items.map(async item => {
                if (item.status == status) {
                    itemFish = await Fish.findOne(item.fish);
                    item['fish'] = itemFish;
                    item = await concatNameVariation(item);
                    shouldGetOrder = true;
                }
            })
            )
            if (shouldGetOrder)
                statusOrders.push(order);
        })
        )

        res.status(200).json(statusOrders);
    },
    getStoreOrderItems: async (req, res) => {
        let userID = req.param("owner");
        let shoppingCartID = req.param('shoppingCartID');

        // get buyer information
        let shoppingCart = await ShoppingCart.findOne({ where: shoppingCartID }).populate('buyer');
        // end get buyer information

        let store = await Store.find({ where: { owner: userID } });

        if (store === undefined)
            return res.status(400).status("not found");

        console.log(store);
        let storeIds = [];
        store.map(item => {
            storeIds.push(item.id);
        })
        console.log(storeIds);
        let storeFishes = await Fish.find({ store: storeIds });

        let storeFishesIds = [];
        storeFishes.map(item => {
            storeFishesIds.push(item.id);
        })
        //console.log( 'shoppingCart: ', shoppingCartID );
        //console.log('fishes ids: ', storeFishesIds);
        let items = await ItemShopping.find(
            {
                where:
                {
                    and: [
                        { fish: storeFishesIds },
                        { shoppingCart: shoppingCartID }

                    ]
                }
            }
        ).populate("fish").populate("shoppingCart").populate("status").sort('createdAt DESC');

        items = await Promise.all(items.map(async item => {
            item.shoppingCart = shoppingCart;
            item = await concatNameVariation(item);
            return item;
        }));

        res.status(200).json(items);

    }

};

