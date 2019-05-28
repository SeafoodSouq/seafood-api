const favoriteFsihCtrl = require("./FavoriteFishController");
const fs = require('fs');
const path = require('path');
const concatNameVariation = async function (item) {
    if (item.variation !== null && item.variation !== undefined) {
        let variation = await Variations.findOne({ id: item.variation })
            .populate("fishPreparation").populate("wholeFishWeight");
        if (variation.wholeFishWeight !== undefined && variation.wholeFishWeight !== null)
            item.fish.name += ", " + variation.wholeFishWeight.name;
        else {
            item.fish.name += ", " + variation.fishPreparation.name;
        }
    }
    return item;
}

module.exports = {
    concatNameVariation,

    getWithAllData: async function (req, res) {
        try {
            let item = await ItemShopping.findOne({ id: req.param("id") }).populate("fish").populate("shoppingCart").populate('status');
            item.shoppingCart = await ShoppingCart.findOne({ id: item.shoppingCart.id }).populate("buyer").populate('orderStatus');

            res.json(item);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getItemsXCart: async function (req, res) {
        try {
            let items = await ItemShopping.find({ shoppingCart: req.param("id") }).populate('status');
            items = await Promise.all(items.map(async function (it) {
                //console.log(it);
                try {
                    it.fish = await Fish.findOne({ id: it.fish });
                    it.fish.store = await Store.findOne({ id: it.fish.store });
                    // it.ItemStatus = await OrderStatus.findOne( { id: it.status } );
                    it.fish.storeOwner = await User.findOne({ id: it.fish.store.owner });
                    it.favorite = await new Promise((resolve, reject) => {
                        let ress = {
                            json: resolve,
                            serverError: reject
                        };
                        reqq = {
                            param: function (id) {
                                let params = {
                                    user: req.param("user"),
                                    fish: it.fish.id
                                };

                                return params[id];
                            }
                        }
                        favoriteFsihCtrl.getXUserAndFish(reqq, ress);
                    });
                }
                catch (e) {
                    console.error(e);
                }

                return it;
            }));

            res.json(items);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getItemsXStorePaid: async function (req, res) {
        try {
            let id = req.param("id");
            let store = await Store.findOne({ id });
            if (store === undefined) {
                return res.status(400).send("not found");
            }

            //cargamos los fish de la tienda
            let fishs = await Fish.find({ store: store.id });

            //cargamos los items shopping con los datos de cart
            let itemsShoppings = [];
            for (let f of fishs) {
                let items = await ItemShopping.find({ fish: f.id }).populate("fish").populate("shoppingCart").populate("status").sort('updatedAt DESC');
                itemsShoppings = itemsShoppings.concat(items);
            }

            //filtrmos los items que ya esten pagados
            itemsShoppings = itemsShoppings.filter(function (it) {
                if (it.shoppingCart === null || it.shoppingCart.status === null) return false;
                return it.shoppingCart.status == "paid" && it.shippingStatus === "pending";
            });

            //Agregamos los datos del comprador
            itemsShoppings = await Promise.all(itemsShoppings.map(async function (it) {
                it.shoppingCart = await ShoppingCart.findOne({ id: it.shoppingCart.id }).populate("buyer");
                return it;
            }));

            res.json(itemsShoppings);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getItemsXStoreAndItemPaid: async function (req, res) {
        try {
            let id = req.param("id");
            let store = await Store.findOne({ id });
            if (store === undefined) {
                return res.status(400).send("not found");
            }

            //cargamos los fish de la tienda
            let fishs = await Fish.find({ store: store.id });

            //cargamos los items shopping con los datos de cart
            let itemsShoppings = [];
            for (let f of fishs) {
                let items = await ItemShopping.find({ fish: f.id }).populate("fish").populate("shoppingCart");
                itemsShoppings = itemsShoppings.concat(items);
            }

            //filtrmos los items que ya esten pagados
            itemsShoppings = itemsShoppings.filter(function (it) {
                if (it.shoppingCart === null || it.shoppingCart.status === null) return false;
                return it.shoppingCart.status === "paid" && it.shippingStatus === "shipped";
            });

            //Agregamos los datos del comprador
            itemsShoppings = await Promise.all(itemsShoppings.map(async function (it) {
                it.shoppingCart = await ShoppingCart.findOne({ id: it.shoppingCart.id }).populate("buyer");
                return it;
            }));

            itemsShoppings = itemsShoppings.sort((a, b) => {
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                return new Date(b.createdAt) - new Date(a.createdAt);
            });

            itemsShoppings = itemsShoppings.map((a) => {
                a.createdAt = new Date(a.createdAt);
                return a;
            });

            res.json(itemsShoppings);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    updateStatusToShipped: async function (req, res) {
        try {

            let id = req.param("id");
            let item = await ItemShopping.findOne({ id }).populate("shoppingCart").populate("fish");
            if (item === undefined) {
                res.status(400).send("not found");
            }

            item = await concatNameVariation(item);
            let cart = await ShoppingCart.findOne({ id: item.shoppingCart.id }).populate("buyer")

            await ItemShopping.update({ id }, { shippingStatus: "shipped", status: '5c017b0e47fb07027943a406' })

            await require("./../../mailer").sendEmailItemRoad(cart.buyer.email, item.trackingID, item.trackingFile, item);

            res.json({ msg: "success" });
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    updateItemStatus: async (req, res) => {
        try {
            let id = req.param("id");
            let status = req.param("status");
            let userEmail = req.body.userEmail;
            let userID = req.body.userID;
            var ts = Math.round((new Date()).getTime() / 1000);
            let data = ''; //
            let item = await ItemShopping.findOne({ id }).populate("shoppingCart").populate("fish");
            //For get trim and concat with name fish
            item = await concatNameVariation(item);

            if (item === undefined) {
                res.status(400).send("not found");
            }
            let currentUpdateDates = [];

            if (item.hasOwnProperty('updateInfo')) {
                if (item.updateInfo != null) {
                    currentUpdateDates = item.updateInfo;
                }
            }
            let newStatus = await OrderStatus.findOne({ id: status });
            let user = await User.findOne({ id: userID });
            currentUpdateDates.push(
                {
                    action: newStatus.status,
                    at: ts,
                    by: `${user.firstName} ${user.lastName}`,
                    userID: userID,
                    email: userEmail,
                    name: `${user.firstName} ${user.lastName}`,
                    ip: req.ip
                }
            )
            let store = await Store.findOne({ id: item.fish.store }).populate("owner")
            let cart = await ShoppingCart.findOne({ id: item.shoppingCart.id }).populate("buyer")
            let name = cart.buyer.firstName + ' ' + cart.buyer.lastName;
            if (status == '5c017af047fb07027943a405') {//update to pending seller fulfillment

                //checking if item still pending seller confirmation
                if (item.status == '5c017ae247fb07027943a404') {
                    let buyerDateParts = item.buyerExpectedDeliveryDate.split('/');
                    let buyerMonth = buyerDateParts[0] - 1;
                    let buyerDay = buyerDateParts[1];
                    let buyerYear = buyerDateParts[2];

                    let buyerDate = new Date(buyerYear, buyerMonth, buyerDay);

                    //when admin update to pending fulfilment, admin not provide a expected delivery date
                    if (req.body.hasOwnProperty('sellerExpectedDeliveryDate')) {
                        let sellerDateParts = req.body.sellerExpectedDeliveryDate.split('/');

                        let sellerMonth = sellerDateParts[0] - 1;
                        let sellerDay = sellerDateParts[1];
                        let sellerYear = sellerDateParts[2];

                        let sellerDate = new Date(sellerYear, sellerMonth, sellerDay);

                        // only change status if seller date is less than buyer date
                        if (sellerDate > buyerDate) {
                            //sent email to the admin with an alert
                            console.log('sent email');
                            await MailerService.sentAdminWarningETA(cart, store, item, name, req.body.sellerExpectedDeliveryDate);
                            data = await ItemShopping.update({ id }, { sellerExpectedDeliveryDate: req.body.sellerExpectedDeliveryDate, updateInfo: currentUpdateDates }).fetch();
                        } else {
                            data = await ItemShopping.update({ id }, { status: '5c017af047fb07027943a405', paymentStatus: '5c017b4547fb07027943a40a', sellerExpectedDeliveryDate: req.body.sellerExpectedDeliveryDate, updateInfo: currentUpdateDates }).fetch();
                        }


                    } else { // admin is updating
                        await ItemShopping.update({ id }, { status: '5c017af047fb07027943a405', paymentStatus: '5c017b4547fb07027943a40a', updateInfo: currentUpdateDates }).fetch();
                    }
                } else {
                    return res.status(400).json({ message: "This items is not longer available for confirm.", item });
                }



            } else if (status == '5c017b0e47fb07027943a406') { //admin marks the item as shipped

                data = await ItemShopping.update({ id },
                    {
                        shippingStatus: "shipped",
                        status: '5c017b0e47fb07027943a406',
                        shippedAt: ts,
                        updateInfo: currentUpdateDates
                    }
                ).fetch();
                await MailerService.itemShipped(name, cart, store, item)
            } else if (status == '5c017b1447fb07027943a407') {//admin marks the item as arrived
                data = await ItemShopping.update({ id }, {
                    status: '5c017b1447fb07027943a407',
                    arrivedAt: ts,
                    updateInfo: currentUpdateDates
                }).fetch();
                //send email to buyer 
                await MailerService.orderArrived(name, cart, store, item)
            } else if (status == '5c017b2147fb07027943a408') { //out for delivery
                data = await ItemShopping.update({ id }, { status: '5c017b2147fb07027943a408', outForDeliveryAt: ts, updateInfo: currentUpdateDates }).fetch()
                //notify buyer about item out for delivery
                item.fish.store = store;
                await MailerService.orderOutForDelivery(name, cart, store, item);
            } else if (status == '5c017b3c47fb07027943a409') { //Delivered
                data = await ItemShopping.update({ id }, { status: '5c017b3c47fb07027943a409', deliveredAt: ts, updateInfo: currentUpdateDates }).fetch()

                /*//check if order is close
                let orderItems = await ItemShopping.find({ where: { shoppingCart: item.shoppingCart.id } });
                console.log('status')
                let isClose = true;
                orderItems.map(itemOrder => {
                    console.log(itemOrder.status);
                    if (itemOrder.status !== '5c017b3c47fb07027943a409' && itemOrder.paymentStatus !== '5c017b7047fb07027943a40e') {
                        isClose = false;
                    }
                })
                // all items are delivered or refunded, so let's update the order status
                if (isClose) {
                    await ShoppingCart.update({ id: item.shoppingCart.id }, {
                        orderStatus: '5c40b364970dc99bb06bed6a',
                        status: 'closed'
                    })
                }*/

                if (data.length > 0) {
                    item.fish.store = store;
                    //send email to buyer 
                    await MailerService.orderDeliveredBuyer(name, cart, store, item);
                    //send email to seller
                    let _name = store.owner.firstName + " " + store.owner.lastName;
                    await MailerService.orderArrivedSeller(_name, cart, store, item);
                }


            } else if (status == '5c017b4547fb07027943a40a') { //Pending Repayment
                data = await ItemShopping.update({ id }, { paymentStatus: '5c017b4547fb07027943a40a', updateInfo: currentUpdateDates }).fetch()
            } else if (status == '5c017b4f47fb07027943a40b') { //Seller Repaid
                let repayedRef = req.param("ref");
                data = await ItemShopping.update({ id }, { paymentStatus: '5c017b4f47fb07027943a40b', repayedAt: ts, repayedRef: repayedRef, updateInfo: currentUpdateDates }).fetch()
                //send email to seller
                let _name = store.owner.firstName + " " + store.owner.lastName;
                await MailerService.orderSellerPaid(_name, cart, store, item);
            } else if (status == '5c017b5a47fb07027943a40c') { //Client Cancelled Order"
                if (['5c017ae247fb07027943a404', '5c017af047fb07027943a405'].includes(item.status)) {
                    data = await ItemShopping.update({ id }, { status: '5c017b5a47fb07027943a40c', paymentStatus: '5c017b6847fb07027943a40d', updateInfo: currentUpdateDates }).fetch();
                    if (data.length > 0) {
                        //send email to buyer
                        await MailerService.buyerCancelledOrderBuyer(name, cart, store, item);
                        //send email to seller
                        await MailerService.buyerCancelledOrderSeller(cart, store, item);
                        //send email to admin
                        await MailerService.buyerCancelledOrderAdmin(cart, store, item);
                    }
                } else {
                    return res.status(400).json({ message: "This items is not longer available for cancel", item });
                }

            } else if (status == '5c017b7047fb07027943a40e') { //Refunded
                data = await ItemShopping.update({ id }, { paymentStatus: '5c017b7047fb07027943a40e', updateInfo: currentUpdateDates }).fetch()

            } else if (status == '5c06f4bf7650a503f4b731fd') { //Seller Cancelled Order
                data = await ItemShopping.update({ id }, { status: '5c06f4bf7650a503f4b731fd', paymentStatus: '5c017b6847fb07027943a40d', updateInfo: currentUpdateDates }).fetch();
                if (data.length > 0) {
                    //send email to buyer
                    await MailerService.sellerCancelledOrderBuyer(name, cart, store, item);
                    //send email to buyer
                    //Obtenemos el store con el owner
                    let _store = await Store.findOne({ id: item.fish.store }).populate("owner")
                    await MailerService.sellerCancelledOrderSeller(_store.owner.firstName + " " + _store.owner.lastName, _store.owner.email, cart, store, item);
                    //send email to admin
                    await MailerService.sellerCancelledOrderAdmin(name, _store.owner.firstName + " " + _store.owner.lastName, cart, store, item);
                }
            } else if (status == '5c13f453d827ce28632af048') {//pending fulfillment
                data = await ItemShopping.update({ id }, { status: '5c13f453d827ce28632af048', paymentStatus: '5c017b4547fb07027943a40a', updateInfo: currentUpdateDates }).fetch();
            } else if (status == '5c017b6847fb07027943a40d') {//pending refund
                data = await ItemShopping.update({ id }, { paymentStatus: '5c017b6847fb07027943a40d', updateInfo: currentUpdateDates }).fetch();
            } else {
                data = await ItemShopping.update({ id }, { status: status, updateInfo: currentUpdateDates }).fetch();
            }
            data = await ItemShopping.find({ id }).populate('status');

            // check if order is closed
            let orderItems = await ItemShopping.find({ where: { shoppingCart: item.shoppingCart.id } });

            let isClose = true;
            console.log('status');
            orderItems.map(itemOrder => {
                console.log(itemOrder.status);
                if (itemOrder.status !== '5c06f4bf7650a503f4b731fd' && itemOrder.status !== '5c017b5a47fb07027943a40c' && itemOrder.status !== '5c017b3c47fb07027943a409' && itemOrder.paymentStatus !== '5c017b7047fb07027943a40e' && itemOrder.paymentStatus !== '5c017b4f47fb07027943a40b') {
                    isClose = false;
                }
            })
            // all items are delivered or refunded, so let's update the order status

            if (isClose) {
                await ShoppingCart.update({ id: item.shoppingCart.id }, {
                    orderStatus: '5c40b364970dc99bb06bed6a',
                    status: 'closed'
                })
                await MailerService.buyerRefund(name, cart, store, item);
            }


            res.status(200).json({ "message": "status updated", item: data });




        } catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getItemsByStatus: async (req, res) => {
        try {
            let status_id = req.param("status");
            let items = await ItemShopping.find({ status: status_id }).populate("fish").populate("shoppingCart").populate("status").sort('createdAt DESC');

            items = await Promise.all(items.map(async function (it) {
                it = await concatNameVariation(it);
                it.store = await Store.findOne({ id: it.fish.store });
                fishCountry = await Countries.findOne({ code: it.fish.country });

                it.country = {
                    code: fishCountry.code,
                    name: fishCountry.name
                }

                Promise.all(fishCountry.cities.map(async function (city) {
                    if (city.code === it.fish.city) {
                        it.city = city;
                    }
                    return city;
                }));

                return it;
            }));



            res.status(200).json(items);

        } catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getPayedItems: async (req, res) => {
        try {

            let items = await ItemShopping.find(
                {
                    where: {
                        paymentStatus: ['5c017b4547fb07027943a40a', '5c017b4f47fb07027943a40b', '5c017b6847fb07027943a40d', '5c017b7047fb07027943a40e']
                    }
                }
            ).populate("fish").populate("shoppingCart").populate("status").populate('paymentStatus').sort('createdAt DESC');

            items = await Promise.all(items.map(async function (it) {
                it = await concatNameVariation(it);
                if (it['store'] !== undefined) {
                    it.store = await Store.findOne({ id: it.fish.store });
                    if (it.fish['country'] !== undefined) {
                        fishCountry = await Countries.findOne({ code: it.fish.country });
                        it.country = {
                            code: fishCountry.code,
                            name: fishCountry.name
                        }

                        Promise.all(fishCountry.cities.map(async function (city) {
                            if (city.code === it.fish.city) {
                                it.city = city;
                            }
                            return city;
                        }));
                    }
                }



                return it;
            }));

            res.json(items);

        } catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getPayedItemsPagination: async (req, res) => {
        try {

            let limit = Number(req.param("limit"));
            let skip = (Number(req.param("page")) - 1) * limit;
            let totalResults = await ItemShopping.count({
                paymentStatus: ['5c017b4547fb07027943a40a', '5c017b4f47fb07027943a40b', '5c017b6847fb07027943a40d', '5c017b7047fb07027943a40e']
            });

            let items = await ItemShopping.find(
                {
                    where: {
                        paymentStatus: ['5c017b4547fb07027943a40a', '5c017b4f47fb07027943a40b', '5c017b6847fb07027943a40d', '5c017b7047fb07027943a40e']
                    },
                    skip,
                    limit
                }
            ).populate("fish").populate("shoppingCart").populate("status").populate('paymentStatus').sort('createdAt DESC');

            items = await Promise.all(items.map(async function (it) {
                it = await concatNameVariation(it);
                if (it['store'] !== undefined) {
                    it.store = await Store.findOne({ id: it.fish.store });
                    if (it.fish['country'] !== undefined) {
                        fishCountry = await Countries.findOne({ code: it.fish.country });
                        it.country = {
                            code: fishCountry.code,
                            name: fishCountry.name
                        }

                        Promise.all(fishCountry.cities.map(async function (city) {
                            if (city.code === it.fish.city) {
                                it.city = city;
                            }
                            return city;
                        }));
                    }
                }



                return it;
            }));



            res.pagination({ page: req.param("page"), limit, datas: items, totalResults });

        } catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getCancelledItems: async (req, res) => {
        try {
            //let status_id = req.param("status");
            let items = await ItemShopping.find(
                {
                    where: {
                        status: ['5c017b5a47fb07027943a40c', '5c06f4bf7650a503f4b731fd']
                    }
                }
            ).populate("fish").populate("shoppingCart").populate("status").sort('createdAt DESC');

            items = await Promise.all(items.map(async function (it) {
                it = await concatNameVariation(it);
                it.store = await Store.findOne({ id: it.fish.store });
                if (it.fish.country) {
                    fishCountry = await Countries.findOne({ code: it.fish.country });
                    it.country = {
                        code: fishCountry.code,
                        name: fishCountry.name
                    }

                    Promise.all(fishCountry.cities.map(async function (city) {
                        if (city.code === it.fish.city) {
                            it.city = city;
                        }
                        return city;
                    }));
                }


                return it;
            }));



            res.status(200).json(items);

        } catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getPayedItemsByOrderNumber: async (req, res) => {
        let orderNumber = req.param('orderNumber')
        try {
            let shoppingCart = await ShoppingCart.find({ 'orderNumber': orderNumber });
            let items = [];
            for (let sc of shoppingCart) {
                items = await ItemShopping.find(
                    {
                        where: {
                            shoppingCart: sc.id,
                            status: ['5c017af047fb07027943a405', '5c017b0e47fb07027943a406', '5c017b1447fb07027943a407', '5c017b2147fb07027943a408', '5c017b3c47fb07027943a409', '5c017b4547fb07027943a40a'],

                        }
                    }
                ).populate("fish").populate("shoppingCart").populate("status").populate('paymentStatus').sort('createdAt DESC');
            }
            await Promise.all(items.map(async function (it) {
                it = await concatNameVariation(it);
                it.store = await Store.findOne({ id: it.fish.store });
                if (it['fish'] !== undefined) {
                    if (it.fish['country'] !== undefined) {
                        if (it.fish.hasOwnProperty(country)) {
                            fishCountry = await Countries.findOne({ code: it.fish.country });
                            it.country = {
                                code: fishCountry.code,
                                name: fishCountry.name
                            }

                            Promise.all(fishCountry.cities.map(async function (city) {
                                if (city.code === it.fish.city) {
                                    it.city = city;
                                }
                                return city;
                            }));
                        }

                    }
                }

                return it;
            }));
            res.status(200).json(items);

        } catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getPayedItemsByOrderNumberPagination: async (req, res) => {
        let orderNumber = req.param('orderNumber')
        try {
            let limit = Number(req.param("limit"));
            let skip = (Number(req.param("page")) - 1) * limit;
            let totalResults = await ShoppingCart.count({ 'orderNumber': orderNumber });

            let shoppingCart = await ShoppingCart.find({ where: { 'orderNumber': orderNumber }, limit, skip });
            let items = [];
            for (let sc of shoppingCart) {
                items = await ItemShopping.find(
                    {
                        where: {
                            shoppingCart: sc.id,
                            status: ['5c017af047fb07027943a405', '5c017b0e47fb07027943a406', '5c017b1447fb07027943a407', '5c017b2147fb07027943a408', '5c017b3c47fb07027943a409', '5c017b4547fb07027943a40a'],

                        }
                    }
                ).populate("fish").populate("shoppingCart").populate("status").populate('paymentStatus').sort('createdAt DESC');
            }
            await Promise.all(items.map(async function (it) {
                it = await concatNameVariation(it);
                it.store = await Store.findOne({ id: it.fish.store });
                if (it['fish'] !== undefined) {
                    if (it.fish['country'] !== undefined) {
                        if (it.fish.hasOwnProperty(country)) {
                            fishCountry = await Countries.findOne({ code: it.fish.country });
                            it.country = {
                                code: fishCountry.code,
                                name: fishCountry.name
                            }

                            Promise.all(fishCountry.cities.map(async function (city) {
                                if (city.code === it.fish.city) {
                                    it.city = city;
                                }
                                return city;
                            }));
                        }

                    }
                }

                return it;
            }));

            res.pagination({ page: req.param("page"), limit, datas: items, totalResults });

        } catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getBuyerCanceledDeliveredOrders: async (req, res) => {
        try {
            let user = req.param('buyer');
            let buyerOrders = await ShoppingCart.find({ buyer: user });

            orderIds = [];
            buyerOrders.map(order => {
                orderIds.push(order.id);
            })

            let where = {
                shoppingCart: orderIds,
                status: ['5c06f4bf7650a503f4b731fd', '5c017b5a47fb07027943a40c', '5c017b3c47fb07027943a409']
            }
            let items = await ItemShopping.find(where).populate('fish').populate('shoppingCart').populate('status').sort('createdAt DESC').limit(1000);

            items = await Promise.all(items.map(async function (it) {
                it = await concatNameVariation(it)
                it.store = await Store.findOne({ id: it.fish.store });
                return it;
            }));



            res.status(200).json(items);
        } catch (error) {
            console.error(error);
            res.serverError(error);
        }
    },
    getAllOrders: async (req, res) => {
        try {
            let where = {};
            if (req.param("status")) {
                if (req.param("status") !== undefined) {
                    where.status = req.param('status')
                    console.log('by status');
                }
            } else {
                let status = await OrderStatus.find();
                let statusIDs = [];
                status.map(record => {
                    statusIDs.push(record.id);
                })

                where.status = statusIDs;
            }
            if (req.param("orderNumber")) {
                let shoppingCart = await ShoppingCart.findOne({ orderNumber: req.param('orderNumber') })
                if (!shoppingCart)
                    return res.status(200).json({ "message": "Order not found" });

                if (shoppingCart !== undefined) {
                    where.shoppingCart = shoppingCart.id;
                    console.log('by orderNumber');
                }

            }
            // get items status available, this way we don't get items in the cart


            console.log(where);
            let items = await ItemShopping.find(where).populate('fish').populate('shoppingCart').populate('status').sort('createdAt DESC').limit(100);

            items = await Promise.all(items.map(async function (it) {
                //		console.log( it.fish.store );
                if (it.hasOwnProperty('fish') && it.fish !== undefined && it.fish !== null) {
                    if (it.fish.hasOwnProperty('store') && it.fish.store !== null && it.fish.store !== undefined) {
                        it.store = await Store.findOne({ id: it.fish.store });
                    }
                }
                it = await concatNameVariation(it);
                return it;
            }));



            res.status(200).json(items);
        } catch (error) {
            console.error(error);
            res.serverError(error);
        }
    },
    getBuyerOrders: async (req, res) => {
        try {
            let buyer = req.param("buyer");
            let where = {};

            // check if we had to filter by status
            if (req.param("status")) {
                if (req.param("status") !== undefined) {
                    where.status = req.param('status')
                    console.log('by status');
                }
            } else {
                // get items status available, this way we don't get items in the cart
                let status = await OrderStatus.find();
                let statusIDs = [];
                status.map(record => {
                    statusIDs.push(record.id);
                })
                where.status = statusIDs;
            }

            // check if we had to filter by order number
            if (req.param("orderNumber")) {
                let shoppingCart = await ShoppingCart.findOne({ buyer: buyer, orderNumber: req.param('orderNumber') })
                if (!shoppingCart)
                    return res.status(200).json({ "message": "Order not found" });

                if (shoppingCart !== undefined) {
                    where.shoppingCart = shoppingCart.id;
                    console.log('by orderNumber');
                }
            } else { // just getting buyer orders
                let shoppingCart = await ShoppingCart.find({ buyer: buyer })
                if (!shoppingCart)
                    return res.status(200).json({ "message": "Order not found" });

                if (shoppingCart !== undefined) {
                    let shoppingCartIDs = [];
                    shoppingCart.map(cart => {
                        shoppingCartIDs.push(cart.id);
                    })
                    where.shoppingCart = shoppingCartIDs;
                    console.log('by orderNumber');
                }
            }



            console.log('where', where);
            let items = await ItemShopping.find(where).populate('fish').populate('shoppingCart').populate('status').sort('createdAt DESC').limit(100);

            items = await Promise.all(items.map(async function (it) {
                it.store = await Store.findOne({ id: it.fish.store });
                it = await concatNameVariation(it);
                return it;
            }));



            res.status(200).json(items);
        } catch (error) {
            console.error(error);
            res.serverError(error);
        }
    },
    updateBuyerETA: async (req, res) => {
        try {
            let etas = req.body.etas;
            items = await Promise.all(etas.map(async function (eta) {
                await ItemShopping.update({ id: eta.id }, { buyerExpectedDeliveryDate: buyerExpectedDeliveryDate });
            }));

            res.status(200).json(etas);

        } catch (error) {
            res.status(400).json(error);
        }
    },

    /**
     * add shipping documents to an itemshopping
     * parameter: 
     *  -item ID
     *  -Array of file uploads
     */
    uploadShippingDocuments: async (req, res) => {
        try {
            let itemShoppingID = req.param("id");
            let itemShopping = await ItemShopping.find({ id: itemShoppingID }).limit(1);
            const dirname = `${sails.config.appPath}/shipping_documents/${itemShoppingID}/`;

            req.file('shippingDocs').upload({
                dirname,
                maxBytes: 10000000,
                saveAs: function (stream, cb) {
                    // keeping file name
                    cb(null, stream.filename);
                }
            }, async (err, uploadedFiles) => {
                if (err) {
                    return res.serverError(err);
                }

                // If no files were uploaded, respond with an error.
                if (uploadedFiles.length === 0) {
                    return res.badRequest('No file was uploaded');
                }

                let shippingDocsUploaded = [];
                if (itemShopping !== undefined) {
                    if (itemShopping[0].shippingFiles !== undefined && itemShopping[0].shippingFiles !== null) {
                        shippingDocsUploaded = itemShopping[0].shippingFiles;
                    }
                }
                for (let file of uploadedFiles) {
                    if (file["status"] === "finished") {
                        dir = "/shipping_documents/" + itemShoppingID + "/" + file.filename;
                        shippingDocsUploaded.push(dir);

                        if (!shippingDocsUploaded.includes(dir)) {
                            shippingDocsUploaded.push(dir);
                        }
                    }
                }
                // saving file paths in the itemshopping 
                await ItemShopping.update({ id: itemShoppingID }, {
                    shippingFiles: shippingDocsUploaded
                })
                res.json(shippingDocsUploaded);

            })
        } catch (error) {
            res.serverError(error);
        }
    },

    //#region actions api v2
    getBuyerOrdersPagination: async (req, res) => {
        try {
            let buyer = req.param("buyer");
            let where = {};

            // check if we had to filter by status
            if (req.param("status")) {
                if (req.param("status") !== undefined) {
                    where.status = req.param('status')
                    console.log('by status');
                }
            } else {
                // get items status available, this way we don't get items in the cart
                let status = await OrderStatus.find();
                let statusIDs = [];
                status.map(record => {
                    statusIDs.push(record.id);
                })
                where.status = statusIDs;
            }

            // check if we had to filter by order number
            if (req.param("orderNumber")) {
                let shoppingCart = await ShoppingCart.findOne({ buyer: buyer, orderNumber: req.param('orderNumber') })
                if (!shoppingCart)
                    return res.status(200).json({ "message": "Order not found" });

                if (shoppingCart !== undefined) {
                    where.shoppingCart = shoppingCart.id;
                    console.log('by orderNumber');
                }
            } else { // just getting buyer orders
                let shoppingCart = await ShoppingCart.find({ buyer: buyer })
                if (!shoppingCart)
                    return res.status(200).json({ "message": "Order not found" });

                if (shoppingCart !== undefined) {
                    let shoppingCartIDs = [];
                    shoppingCart.map(cart => {
                        shoppingCartIDs.push(cart.id);
                    })
                    where.shoppingCart = shoppingCartIDs;
                    console.log('by orderNumber');
                }
            }
            let limit = Number(req.param("limit"));
            let skip = (Number(req.param("page")) - 1) * limit;
            let totalResults = await ItemShopping.count({ where });

            let items = await ItemShopping.find({ where, skip: skip, limit, })
                .populate('fish')
                .populate('shoppingCart')
                .populate('status')
                .sort('createdAt DESC')

            items = await Promise.all(items.map(async function (it) {
                it = await concatNameVariation(it);
                it.store = await Store.findOne({ id: it.fish.store });
                return it;
            }));



            res.pagination({ page: req.param("page"), limit, datas: items, totalResults });
        } catch (error) {
            console.error(error);
            res.serverError(error);
        }
    },

    getAllOrdersPagination: async (req, res) => {
        try {
            let where = {};
            if (req.param("status")) {
                if (req.param("status") !== undefined) {
                    where.status = req.param('status')
                    console.log('by status');
                }
            } else {
                let status = await OrderStatus.find();
                let statusIDs = [];
                status.map(record => {
                    statusIDs.push(record.id);
                })

                where.status = statusIDs;
            }
            if (req.param("orderNumber")) {
                let shoppingCart = await ShoppingCart.findOne({ orderNumber: req.param('orderNumber') })
                if (!shoppingCart)
                    return res.status(200).json({ "message": "Order not found" });

                if (shoppingCart !== undefined) {
                    where.shoppingCart = shoppingCart.id;
                    console.log('by orderNumber');
                }

            }

            let limit = Number(req.param("limit"));
            let skip = (Number(req.param("page")) - 1) * limit;
            let totalResults = await ItemShopping.count({ where });

            let items = await ItemShopping.find({ where, skip: skip, limit, })
                .populate('fish')
                .populate('shoppingCart')
                .populate('status')
                .sort('createdAt DESC');

            await Promise.all(items.map(async function (it) {
                //		console.log( it.fish.store );
                if (it.hasOwnProperty('fish') && it.fish !== undefined && it.fish !== null) {
                    if (it.fish.hasOwnProperty('store') && it.fish.store !== null && it.fish.store !== undefined) {
                        it.store = await Store.findOne({ id: it.fish.store });
                    }
                }
                return it;
            }));



            res.pagination({ page: req.param("page"), limit, datas: items, totalResults });
        } catch (error) {
            console.error(error);
            res.serverError(error);
        }
    },

    //#endregion
};

