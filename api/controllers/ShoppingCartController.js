const getDescription = async (it) => {
    //Para obtener la description del fish
    let description = it.fish.name;
    if (it.fish.treatment !== null && it.fish.treatment !== undefined) {
        let treatment = await Treatment.findOne({ id: it.fish.treatment });
        if (treatment !== undefined) description += " - " + treatment.name;
    }
    if (it.fish.raised !== null && it.fish.raised !== undefined) {
        let raised = await Raised.findOne({ id: it.fish.raised });
        if (raised !== undefined) description += " - " + raised.name;
    }
    // if (it.fish.preparation !== null && it.fish.preparation !== undefined) {
    //     let preparation = await FishPreparation.findOne({ id: it.fish.preparation });
    //     if (preparation !== undefined) description += ", " + preparation.name;
    // }
    if (it.fish.wholeFishWeight !== null && it.fish.wholeFishWeight !== undefined) {
        let wholeFishWeight = await WholeFishWeight.findOne({ id: it.fish.preparation });
        if (wholeFishWeight !== undefined) description += ", " + wholeFishWeight.name;
    }
    return description;
}

const concatNameVariation = require("./ItemShoppingController").concatNameVariation;

module.exports = {

    testOrder: async (req, res) => {
        try {
            let lastOrder = await ShoppingCart.find().sort('orderNumber DESC').limit(1);//.max('orderNumber');
            let max = 0;
            console.log(lastOrder);
            if (lastOrder.length > 0) {
                if (lastOrder[0].hasOwnProperty("orderNumber")) {
                    max = lastOrder[0].orderNumber + 1;
                }
            }

            res.status(200).json(max);
        } catch (error) {
            res.serverError(error);
        }
    },

    createCart: async function (req, res) {
        try {
            let today = new Date();
            let buyer = req.param("buyer");
            let cart = await ShoppingCart.findOne({ buyer, status: "pending" }).populate("items");
            let currentAdminCharges = await sails.helpers.currentCharges();

            let in_AED = true;
            if (cart !== undefined) {
                let totalShipping = 0;
                let totalSFSMargin = 0;
                let totalCustoms = 0;
                let totalUAETaxes = 0;
                let totalOtherFees = 0;
                let subtotal = 0;
                let total = 0;

                //group items by seller
                shippingItems = [];
                await Promise.all(cart.items.map(async item => {
                    let itemStore = await Fish.findOne({ id: item.fish }).populate('store');
                    let fishCharges = await sails.helpers.fishPricing(item.fish, item.quantity.value, currentAdminCharges, item.variation, in_AED)
                    item.fish = itemStore;
                    item.store = itemStore.store.id;
                    item.country = itemStore.country;
                    item.city = itemStore.city;
                    item.fishCharges = fishCharges;

                    //order items by store and putting them into shippingItems
                    let storeIsThere = false
                    let storeIndex = 0;
                    await Promise.all(shippingItems.map((shippingItem, index) => {
                        if (shippingItem.store == itemStore.store.id) {
                            storeIsThere = true;
                            storeIndex = index;
                        }
                        return shippingItem;
                    }))
                    if (!storeIsThere) {
                        shippingItems.push({ store: itemStore.store.id, items: [] });
                        shippingItems[shippingItems.length - 1].items.push(item);
                    } else {
                        shippingItems[storeIndex].items.push(item);
                    }

                }))

                let resss = [];
                await Promise.all(shippingItems.map(async store => {
                    let totalWeight = 0;
                    let country = '';
                    let city = '';
                    let firstMileFee = 0;
                    let itemID = 0; //this is an item id just for know the order and then the helper could calculate the shipping fee
                    await Promise.all(store.items.map(async item => {
                        fishCharges = item.fishCharges //await sails.helpers.fishPricing( item.fish.id, item.quantity.value, currentAdminCharges );
                        firstMileFee += fishCharges.firstMileFee;
                        totalWeight += item.quantity.value;
                        country = item.country;
                        city = item.city;

                        return item;

                    }))

                    shippingRate = await sails.helpers.shippingBySeller(firstMileFee, city, totalWeight, currentAdminCharges);

                    // here we calculate the shipping for all the items of one store in one Order
                    store.totalWeight = totalWeight;
                    store.shipping = shippingRate; //{ firstMileFee, totalWeight: totalWeight, country: country, city: city };

                    // now we calculate how much belongs to each product in the seller
                    await Promise.all(store.items.map(item => {
                        item.shippingStore = item.quantity.value * store.shipping.shippingCost / store.totalWeight;
                        item.shipping = item.shippingStore;
                        return item;
                    }))
                    return store;
                }))
                //setting min dalivery date for each item
                await Promise.all(cart.items.map(async function (it) {
                    it.fish = await Fish.findOne({ id: it.fish.id }).populate("type").populate("store");
                    it.fishCharges = it.fishCharges;// await sails.helpers.fishPricing(it.fish.id, it.quantity.value, currentAdminCharges)
                    it.fish['price']['value'] = it.fishCharges.variation.price;

                    console.log('it', it.fishCharges.variation.id);
                    console.log('it 2', it.variation);
                    let itVariationPrice = await VariationPrices.find({ id: it.fishCharges.variation.id }).populate('variation');
                    let itVariation = await Variations.find({ id: it.variation });
                    // get fish Preparation  of each item   
                    console.log('itVariationPrice', itVariationPrice);
                    it['fishPreparation'] = await FishPreparation.find({ id: itVariation[0].fishPreparation });
                    //console.log( 'fp', it['fishPreparation'] );
                    if (it.fishCharges.variation.variation.fishPreparation === '5c93bff065e25a011eefbcc2' || it.fishCharges.variation.variation.fishPreparation === '5c93c00465e25a011eefbcc3') {
                        // get whole fish weight of each item
                        //  console.log( 'ww',  itVariationPrice[0].variation.wholeFishWeight );
                        it['wholeFishWeight'] = await WholeFishWeight.find({ id: itVariation[0].wholeFishWeight });
                    }

                    let fishCountry = await Countries.findOne({ code: it.fish.country });
                    //console.log('fishCountry', fishCountry);
                    min = new Date();
                    if (fishCountry == undefined) {
                        it.adminNumberOfDaysForDelivery = 3;
                        min.setDate(today.getDate() + 3);
                    } else if (it.city == undefined || fishCountry.eta == undefined) {
                        it.adminNumberOfDaysForDelivery = 3;
                        min.setDate(today.getDate() + 3);
                    } else {
                        it.adminNumberOfDaysForDelivery = fishCountry.eta;
                        min.setDate(today.getDate() + fishCountry.eta);
                    }

                    it.minDeliveryDate = min;

                    shippingRate = await sails.helpers.shippingByCity(it.fish.city, it.quantity.value);
                    it.owner = await User.findOne({ id: it.fish.store.owner })
                    it.shippingCost = it.fishCharges.shippingCost.cost;

                    //now we calculate the shipping for each seller so we replace the shipping calc
                    await Promise.all(shippingItems.map(async store => {
                        await Promise.all(store.items.map(async item => {
                            if (item.id == it.id) {
                                it.fishCharges.finalPrice = it.fishCharges.finalPrice - it.fishCharges.shippingCost.cost + item.shippingStore;
                                //it.fishCharges.shippingCost.cost = item.shippingStore;
                                //await ItemShopping.update({ id: it.id }, { fishCharges: it.fishCharges });
                                console.log('shipping', item.shippingStore);
                                it.shipping = item.shippingStore;
                            }
                            return item;
                        }));
                        return store;
                    }))


                    totalShipping += it.fishCharges.shippingCost.cost;
                    //console.log( 'now shipping', totalShipping);
                    totalSFSMargin += it.fishCharges.sfsMarginCost;
                    totalCustoms += it.fishCharges.customsFee;
                    totalUAETaxes += it.fishCharges.uaeTaxesFee;

                    subtotal += it.fishCharges.fishCost;
                    total += it.fishCharges.finalPrice;

                    it.currentCharges = {
                        sfsMargin: it.fishCharges.sfsMargin,
                        shipping: it.fishCharges.shipping,
                        customs: it.fishCharges.customs,
                        flatCustoms: it.fishCharges.flatCustoms
                    };


                    /// validate is Admin has not set pricing charges
                    if (!it.fishCharges.sfsMarginCost || it.fishCharges.sfsMarginCost == "NaN") {
                        it.fishCharges.sfsMarginCost = 0;
                    }
                    if (!it.fishCharges.uaeTaxesFee || it.fishCharges.uaeTaxesFee == "NaN") {
                        it.fishCharges.uaeTaxes = 0;
                        it.fishCharges.uaeTaxesFee = 0;
                    }

                    if (!it.fishCharges.uaeTaxes || it.fishCharges.uaeTaxes == "NaN") {
                        it.fishCharges.uaeTaxes = 0;
                    }


                    it.sfsMargin = it.fishCharges.sfsMarginCost;
                    it.customs = it.fishCharges.customsFee;
                    it.uaeTaxes = it.fishCharges.uaeTaxesFee;


                    await ItemShopping.update({ id: it.id }, {
                        currentCharges: it.currentCharges,
                        shipping: isNaN(it.fishCharges.shippingCost.cost) == true ? 0 : it.fishCharges.shippingCost.cost,
                        shippingStore: it.shipping,
                        sfsMargin: isNaN(it.sfsMargin) === true ? 0 : it.sfsMargin,
                        customs: it.customs,
                        uaeTaxes: it.uaeTaxes,
                        subtotal: Number((it.quantity.value * it.fishCharges.variation.price).toFixed(2)),
                        total: (it.quantity.value * it.fishCharges.variation.price) + it.shipping + it.sfsMargin + it.customs + it.uaeTaxes
                    })

                    return it;
                }));

                totalOtherFees = totalSFSMargin + totalCustoms;
                totalOtherFees = Number(parseFloat(totalOtherFees).toFixed(2));
                totalShipping = Number(parseFloat(totalShipping).toFixed(2));
                // console.log('total SHipping', totalShipping);
                totalUAETaxes = Number(parseFloat(totalUAETaxes).toFixed(2));
                total = Number(parseFloat(subtotal + totalOtherFees + totalShipping + totalUAETaxes).toFixed(2));

                totalSFSMargin = isNaN(totalSFSMargin) === true ? 0 : totalSFSMargin;
                subtotal = isNaN(subtotal) === true ? 0 : subtotal;
                total = isNaN(total) === true ? 0 : total;
                totalOtherFees = isNaN(totalOtherFees) === true ? 0 : totalOtherFees;
                totalUAETaxes = isNaN(totalUAETaxes) === true ? 0 : totalUAETaxes

                let newCart = await ShoppingCart.update({ id: cart.id }, {
                    currentCharges: currentAdminCharges,
                    subTotal: subtotal,
                    shipping: totalShipping,
                    sfsMargin: totalSFSMargin,
                    customs: totalCustoms,
                    total: total,
                    totalOtherFees: totalOtherFees,
                    uaeTaxes: totalUAETaxes,
                }).fetch();
                cart.total = total;
                cart.subTotal = subtotal;
                cart.customs = totalCustoms;
                cart.totalOtherFees = totalOtherFees;
                cart.totalUAETaxes = totalUAETaxes;
                cart.totalShipping = totalShipping;
                cart.shipping = totalShipping;


                //}

                return res.json(cart)
            };
            //console.log('start');

            cart = await ShoppingCart.create(
                {
                    buyer: buyer
                }
            ).fetch();

            res.status(200).json(cart);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getOpenOrders: async (req, res) => {
        try {
            let buyer = req.param("buyer");
            let orders = await ShoppingCart.find({ orderStatus: "5c017ad347fb07027943a403", buyer }).populate("items").populate('orderStatus').sort('createdAt DESC');

            orders = await Promise.all(orders.map(async (order) => {


                let items = await Promise.all(order.items.map(async (item) => {
                    item['fish'] = await Fish.findOne({ id: item.fish }).populate('store');
                    item['seller'] = await User.findOne({ id: item.fish.store.owner });
                    item['status'] = await OrderStatus.findOne({ id: item.status });
                    item = await concatNameVariation(item);
                    delete item.seller.token;
                    delete item.seller.password;
                    return item;
                }))
                order['items'] = items;
                return order;
            }))



            res.status(200).json(orders);

        } catch (error) {
            console.error(e);
            res.serverError(e);
        }
    },

    getCartPaid: async (req, res) => {
        try {
            let buyer = req.param("buyer");
            let carts = await ShoppingCart.find({ status: "close", buyer }).populate("items").sort("createdAt DESC");

            //Para calcular el total de los carritos
            let calcTotal = async (cart) => {
                cart.items = await Promise.all(cart.items.map(async function (it) {
                    it.fish = await Fish.findOne({ id: it.fish }).populate("type").populate("store");
                    return it;
                }));

                let total = 0;
                for (var it of cart.items) {
                    total += Number(it.price.value * it.quantity.value);
                }

                total = Number(parseFloat(total).toFixed(2));
                if (total !== cart.total) {
                    await ShoppingCart.update({ id: cart.id }, { total: total });
                    cart.total = total;
                }

                return cart;
            }

            let cartFinish = [];
            for (let cart of carts) {
                let c = await calcTotal(cart);
                cartFinish.push(c);
            }

            cartFinish = cartFinish.sort((a, b) => {
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                return new Date(b.createdAt) - new Date(a.createdAt);
            }).map((a) => {
                a.createdAt = new Date(a.createdAt);
                return a;
            });


            res.status(200).json(cartFinish);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    addItem: async (req, res) => {
        try {
            let currentAdminCharges = await sails.helpers.currentCharges();
            let in_AED = true;
            //itemCharges = await sails.helpers.fishPricing( req.param("fish"), req.param("quantity"), currentAdminCharges, req.param('variation_id'), in_AED );
            let id = req.param("id")
            variation_id = req.body.variation_id,
                item = {
                    shoppingCart: id,
                    fish: req.body.fish,
                    quantity: req.body.quantity,
                    price: req.body.price,
                    shippingStatus: req.body.shippingStatus,
                    variation: req.body.variation_id
                };

            // check if this item is already in this cart
            itemCharges = await sails.helpers.fishPricing(item.fish, item.quantity.value, currentAdminCharges, variation_id, in_AED);

            item['quantity']['value'] = itemCharges.weight; //weight could be different in fish pricing if the product is per box, here we update the weight

            item['itemCharges'] = itemCharges;
            item['price'] = itemCharges.price; //getting variation price
            let alredyInCart = await ItemShopping.find({
                shoppingCart: id,
                fish: item.fish,
                variation: variation_id
            });

            console.log('alread in cart', alredyInCart)

            let itemShopping;
	    let fishInfo = await Fish.findOne({ id: req.body.fish });
            if( fishInfo.hasOwnProperty("perBox") ) {
              if( fishInfo.perBox === true) { // if is per box the app is sending the number of boxes, not the weight
                fishInfo.maximumOrder = fishInfo.boxWeight * fishInfo.maximumOrder;
                fishInfo.minimumOrder = fishInfo.boxWeight * fishInfo.minimumOrder;
              }
            }
            if (alredyInCart !== undefined && alredyInCart[0] !== undefined) {
                /*let fishInfo = await Fish.findOne({ id: req.body.fish });
                if( fishInfo.hasOwnProperty("perBox") ) {
                    if( fishInfo.perBox === true) { // if is per box the app is sending the number of boxes, not the weight
                        fishInfo.maximumOrder = fishInfo.boxWeight * fishInfo.maximumOrder;
                        fishInfo.minimumOrder = fishInfo.boxWeight * fishInfo.minimumOrder;
                    }
                }*/
		console.log(fishInfo.minimumOrder );
		console.log( fishInfo.maximumOrder );
                if (fishInfo.maximumOrder < (parseFloat(item.quantity.value) + parseFloat(alredyInCart[0].quantity.value))) {
                    return res.status(400).json({ message: "Maximum order limit reached" })

                } else if (fishInfo.minimumOrder > (item.quantity.value + parseFloat(alredyInCart[0].quantity.value))) {
                    return res.status(400).json({ message: "Order is below the minimum" })
                } else {
                    let item_id = alredyInCart[0].id;
                    item.quantity.value = parseFloat(item.quantity.value) + parseFloat(alredyInCart[0].quantity.value);
                    itemShopping = await ItemShopping.update({ id: item_id }, item);
                }
                //return res.status(200).send( item );
            } else {
                /*let fishInfo = await Fish.findOne({ id: req.body.fish });*/
                if (fishInfo.maximumOrder < (parseFloat(item.quantity.value))) {
                    return res.status(400).json({ message: "Maximum order limit reached" })

                } else if (fishInfo.minimumOrder > item.quantity.value) {
                    return res.status(400).json({ message: "Order is below the minimum" })
                } else {
                    itemShopping = await ItemShopping.create(item);
                }
            }

            //let itemShopping = await ItemShopping.create(item);

            //Para calcular el total del carrito
            let cart = await ShoppingCart.findOne({ id }).populate("items");

            let total = 0;
            for (var it of cart.items) {
                itemCharges = await sails.helpers.fishPricing(it.fish, it.quantity.value, currentAdminCharges, variation_id, in_AED);
                total += itemCharges['finalPrice'];
            }

            total = Number(parseFloat(total).toFixed(2));
            total = isNaN(total) === true ? 0 : total;
            await ShoppingCart.update({ id: cart.id }, { total: total });

            cart.total = total;
            cart.items = await Promise.all(cart.items.map(async (i) => {
                i.fish = await Fish.findOne({ id: i.fish });
                return i;
            }));

            res.json(cart);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    updateItems: async (req, res) => {
        try {

            let items = req.param("items");
            if (Object.prototype.toString.call(items) !== "[object Array]") {
                return res.status(500).send("invalid parameter items");
            }

            for (let it of items) {
                let id = it.id;
                delete it.id;
                await ItemShopping.update({ id }, it);
            }

            res.json({ msg: "success" });

        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    getPopulateXID: async function (req, res) {
        try {

            let id = req.param("id");
            let cart = await ShoppingCart.findOne().where({ id }).populate("items");
            if (cart === undefined) {
                return res.status(400).send('not found');
            }

            cart.items = await Promise.all(cart.items.map(async function (it) {
                it.fish = await Fish.findOne({ id: it.fish }).populate("type");
                return it;
            }));

            let total = 0;
            for (var it of cart.items) {
                total += Number(it.price.value * it.quantity.value);
            }

            total = Number(parseFloat(total).toFixed(2));
            if (total !== cart.total) {
                await ShoppingCart.update({ id: cart.id }, { total: total });
                cart.total = total;
            }

            res.json(cart);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },

    updateShoppingCartPaid: async function (req, res) {
        try {
            // let exchangeRates = await PricingCharges.find({ where: { type: 'exchangeRates' } }).sort('updatedAt DESC').limit(1);
            let uaeTaxes = await PricingCharges.find({ where: { type: 'uaeTaxes' } }).sort('updatedAt DESC').limit(1);

            let paidDateTime = new Date().toISOString();

            //get last order number in db
            let lastOrder = await ShoppingCart.find().sort('orderNumber DESC').limit(1);//.max('orderNumber');
            let max = 0;
            if (lastOrder.length > 0)
                if (lastOrder[0].hasOwnProperty("orderNumber"))
                    max = lastOrder[0].orderNumber + 1;
            let OrderNumber = max;
            let storeName = [];

            // invoice is the same as Order number
            let invoiceNumber = OrderNumber;
            // last purchase order is a separate counter for the items
            let lastPurchaseOrder = await ItemShopping.find().sort('purchaseOrder DESC').limit(1);//.max('orderNumber');
            let maxPurchaseOrder = 0;
            if (lastPurchaseOrder.length > 0)
                if (lastPurchaseOrder[0].hasOwnProperty("purchaseOrder"))
                    maxPurchaseOrder = lastPurchaseOrder[0].purchaseOrder;

            let cart = await ShoppingCart.findOne({ id: req.param("id") }).populate("buyer");
            if (cart === undefined) {
                return res.status(400).send("not found");
            }
            let itemsShopping = await ItemShopping.find({ shoppingCart: cart.id }).populate("fish");
            //generate purchase order number for each item
            //await Promise.all(itemsShopping.map(async function (it, index) {
            //it.fish.store = await Store.findOne({ id: it.fish.store }).populate("owner");
            /*await ItemShopping.update({ id: it.id }).set({ status: '5c017ae247fb07027943a404', orderInvoice: invoiceNumber, purchaseOrder: (maxPurchaseOrder + 1 + index) });

            let fullName = it.fish.store.owner.firstName+ " "+ it.fish.store.owner.lastName;
            let fullNameBuyer = cart.buyer.firstName + " " + cart.buyer.lastName;
            let sellerAddress = it.fish.store['Address'];
*/
            //let sellerInvoice = await PDFService.sellerPurchaseOrder(fullName, cart, it, OrderNumber, sellerAddress, (maxPurchaseOrder + 1 + index), exchangeRates[0].price, it.buyerExpectedDeliveryDate);
            //return it;
            //}));
            console.info('store group');
            //para agregarles el nombre con el variations
            itemsShopping = await Promise.all(itemsShopping.map(async function(it){
                it = await concatNameVariation(it);
                it.description = await getDescription(it);
                return it;
            }));

            //Ahora agrupamos los compras por store para avisar a sus dueños de las ventas
            let itemsStore = [];
            for (let item of itemsShopping) {
                
                let index = itemsStore.findIndex(function (it) {
                    return it[0].fish.store.id === item.fish.store.id;
                });

                if (index === -1) {
                    itemsStore.push([item]);
                } else {
                    itemsStore[index].push(item);
                }
            }

            let OrderStatus = "5c017ad347fb07027943a403"; //Pending Seller Confirmation
            cartUpdated = await ShoppingCart.update({ id: req.param("id") }, {
                status: "paid",
                paidDateTime: paidDateTime,
                orderNumber: OrderNumber,
                orderStatus: OrderStatus

            }).fetch();
            //Agregamos el paidDate al cart
            cart.paidDateTime = paidDateTime;
            //Se envia los correos a los dueños de las tiendas
            let counter = 0;
            for (let st of itemsStore) {
                counter += 1;
                /*storeName.push(st[0].fish.store['name']);
                // shippingRate.push(await require('./ShippingRatesController').getShippingRateByCities( st[0].fish.city, st[0].quantity.value ));
                let fullName = st[0].fish.store['name'];//st[0].fish.store.owner.firstName + " " + st[0].fish.store.owner.lastName;
                let fullNameBuyer = cart.buyer.firstName + " " + cart.buyer.lastName;
                let sellerAddress = st[0].fish.store['Address']; //`${st[0].fish.store.owner.dataExtra.Address}, ${st[0].fish.store.owner.dataExtra.City}, ${st[0].fish.store.owner.dataExtra.country}, ${st[0].fish.store.owner.dataExtra.zipCode}`;                
                //let sellerInvoice = await PDFService.sellerPurchaseOrder( fullName, cart, st, OrderNumber, sellerAddress, counter, exchangeRates[0].price );
                */
                console.info('store', st);

                st[0].fish.store = await Store.findOne({ id: st[0].fish.store }).populate("owner");
                st[0].fish.store.owner = await User.findOne({ id: st[0].fish.store.owner.id }).populate("incoterms");
                let items_store_ids = [];
                st.map(itemStore => {
                    items_store_ids.push(itemStore.id)
                })
                await ItemShopping.update({ id: items_store_ids }).set({ status: '5c017ae247fb07027943a404', orderInvoice: invoiceNumber, purchaseOrder: (maxPurchaseOrder + 1 + counter) });

                let fullName = st[0].fish.store.owner.firstName + " " + st[0].fish.store.owner.lastName;
                let fullNameBuyer = cart.buyer.firstName + " " + cart.buyer.lastName;
                let sellerAddress = st[0].fish.store['Address'];
                let incoterms = st[0].fish.store.owner.incoterms !== null && st[0].fish.store.owner.incoterms !== undefined ? st[0].fish.store.owner.incoterms : { name: "Ex Work" };
                console.log("\n\n aquiii", cart, "\n\n");
                let sellerInvoice = await PDFService.sellerPurchaseOrder(fullName, cart, st, OrderNumber, sellerAddress, (maxPurchaseOrder + 1 + counter), cart.currentCharges.exchangeRates, st[0].buyerExpectedDeliveryDate, incoterms, cart.subTotal, cart.total);

                //console.log( 'seller invoice', sellerInvoice );
            }

            //Para agregar la description a los items
            itemsShopping = await Promise.all(itemsShopping.map(async (it) => {
                it.description = await getDescription(it);
                return it;
            }));
            await MailerService.sendCartPaidAdminNotified(itemsShopping, cart, OrderNumber, storeName)

            //Despues de generar el invoice se crea el correo
            await PDFService.buyerInvoice(itemsShopping, cart, OrderNumber, storeName, uaeTaxes[0].price)


            res.json(cartUpdated);
        }
        catch (e) {
            console.error(e);
            res.serverError(e);
        }
    },
    getOrderLogistic: async function (req, res) {
        try {
            // let orders = await ShoppingCart.find( { orderNumber: { '!=': null } } ).populate('buyer').populate('orderStatus').populate('items').sort('orderNumber DESC');
            var db = ShoppingCart.getDatastore().manager;
            var _shopping = db.collection(ShoppingCart.tableName);

            let orders = await new Promise((resolve, reject) => {
                _shopping.find({ $and: [{ orderNumber: { $ne: null } }, { orderNumber: { $ne: 0 } }] }, { _id: 1, orderNumber: 1 })
                    .sort({ orderNumber: -1 })
                    // PARA EL FUTURO, PAGINATION
                    // .skip(Number(req.param("skip")))
                    // .limit(Number(req.param("limit")))
                    .toArray(async (err, arr) => {
                        if (err) { return reject(err); }
                        arr = arr.map(it => { return it._id.toString(); });
                        let orders = [];
                        for (let id of arr) {
                            let order = await ShoppingCart.findOne({ id }).populate('buyer').populate('orderStatus').populate('items');
                            let items = [];
                            await Promise.all(order.items.map(async item => {
                                let fishItem = await Fish.findOne({ id: item.fish }).populate('store').populate('type').populate('status')
                                item.fishItem = fishItem;
                                item.fish = fishItem;
                                item = await concatNameVariation(item);
                                items.push(item);

                            }))
                            order.items = items;
                            orders.push(order);
                        }
                        resolve(orders);
                    });
            });

            res.status(200).json(orders);

        } catch (error) {
            res.status(400).json(error);
        }

    },

    getOrderLogisticPagination: async function (req, res) {
        try {
            // let orders = await ShoppingCart.find( { orderNumber: { '!=': null } } ).populate('buyer').populate('orderStatus').populate('items').sort('orderNumber DESC');
            var db = ShoppingCart.getDatastore().manager;
            var _shopping = db.collection(ShoppingCart.tableName);

            let limit = Number(req.param("limit"));
            let skip = (Number(req.param("page")) - 1) * limit;
            // let totalResults = await OrderStatus.count({ id: ids });

            let totalResults = await _shopping.count({ $and: [{ orderNumber: { $ne: null } }, { orderNumber: { $ne: 0 } }] }, { _id: 1, orderNumber: 1 })
            let orders = await new Promise((resolve, reject) => {
                _shopping.find({ $and: [{ orderNumber: { $ne: null } }, { orderNumber: { $ne: 0 } }] }, { _id: 1, orderNumber: 1 })
                    .sort({ orderNumber: -1 })
                    // PARA EL FUTURO, PAGINATION
                    .skip(skip)
                    .limit(limit)
                    .toArray(async (err, arr) => {
                        if (err) { return reject(err); }
                        arr = arr.map(it => { return it._id.toString(); });
                        let orders = [];
                        for (let id of arr) {
                            let order = await ShoppingCart.findOne({ id }).populate('buyer').populate('orderStatus').populate('items');
                            let items = [];
                            await Promise.all(order.items.map(async item => {
                                let fishItem = await Fish.findOne({ id: item.fish }).populate('store').populate('type').populate('status')
                                item.fishItem = fishItem;
                                item.fish = fishItem;
                                item = await concatNameVariation(item);
                                items.push(item);

                            }))
                            order.items = items;
                            orders.push(order);
                        }
                        resolve(orders);
                    });
            });

            return res.pagination({ page: req.param("page"), limit, datas: orders, totalResults });

        } catch (error) {
            res.status(400).json(error);
        }

    },

    sendPDF: async (req, res) => {
        try {
            let directory = req.param("directory");
            let name = req.param("name");
            PDFService.sendPDF(req, res, directory, name);
        } catch (error) {
            res.serverError(error);
        }
    }

};

