var fs = require('fs');
var ejs = require('ejs');
var pdf = require('html-pdf')
var api_url = sails.config.custom.baseUrl;
const moment = require('moment');

//Esta propiedada wholeFishWeight, no es definida
//en algunos productos por eso necesito definirla.
const verifiedWholeFishWeight = function (items) {
    if (items.typeObject() === "array") {
        for (let i = 0; i < items.length; i++) {
            let it = items[i];
            if (it.isDefined("wholeFishWeight") === false) {
                it.wholeFishWeight = "";
            }
            items[i] = it;
        }
    } else if (items.typeObject() === "object") {
        if (items.isDefined("wholeFishWeight") === false) {
            items.wholeFishWeight = "";
        }
    }

    return items;
};

//for process the html template to pdf
const processData = async function (itemsShopping, cart, OrderNumber, uaeTaxes, paid, namePdf) {
    itemsShopping = verifiedWholeFishWeight(itemsShopping);
    var compiled = await ejs.compile(fs.readFileSync(__dirname + `/../../pdf_templates/${namePdf}.html`, 'utf8'));
    console.log('cart', cart);
    let today = new Date();
    let date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
    let paidDateTime = date;
    let buyerContactPostalAddress = '';
    //to get all data of postal and check if is defined
    if (cart.shippingAddress !== null && cart.shippingAddress !== undefined)
        buyerContactPostalAddress = `${cart.shippingAddress.address} ${cart.shippingAddress.city}, ${cart.shippingAddress.country}`;
    //vat, some times have ',', so quit ',' for that working well parseInt
    let vat = cart.buyer.dataExtra.vat || 0;
    vat = vat.toString().replace(/,/g, '');
    var html = await compiled(
        {
            invoiceDueDate: paidDateTime,
            invoiceDate: paidDateTime,
            companyName: cart.buyer.dataExtra.companyName,
            buyerContactName: cart.buyer.firstName + ' ' + cart.buyer.lastName,
            buyerContactPostalAddress,
            contactAccountNumber: '100552524900003',
            InvoiceNumber: 'InvoiceNumber',
            vat,
            purchase_order_date: paidDateTime,
            delivery_order_date: paidDateTime,
            invoice_number: OrderNumber,
            orderNumber: OrderNumber,
            items: itemsShopping,
            subTotal: cart.subTotal,
            customHandlingFee: cart.totalOtherFees,
            uaeTaxesFee: cart.uaeTaxes,
            shippingFees: cart.shipping,
            total: cart.total,
            uaeTaxes: uaeTaxes,
            vatuaeTaxes: cart.uaeTaxes,
            api_url: api_url,
            paid,
            cart
        }
    );
    return html;
}

const getName = function(orderNumber, cart){
    return orderNumber+ '-'+ cart.buyer.dataExtra.companyName.replace(/ /g, '') + '-'+ moment().format('DDMMYY')+ '.pdf';
};

module.exports = {
    buyerInvoice: async (itemsShopping, cart, OrderNumber, storeName, uaeTaxes, paid) => {
        console.log('\n\n total', JSON.parse( JSON.stringify(cart) ).total);
        let html = await processData(itemsShopping, cart, OrderNumber, uaeTaxes, paid, 'invoice');
        console.log('\n\n total__', JSON.parse( JSON.stringify(cart) ).total);
        let pdf_name = getName(OrderNumber, cart);
        await pdf.create(html).toFile(`./pdf_invoices/${pdf_name}`, async () => {
            console.log('pdf done', pdf_name);
            MailerService.sendCartPaidBuyerNotified(itemsShopping, cart, OrderNumber, storeName, pdf_name, OrderNumber);
            await ShoppingCart.update({ id: cart.id }, { invoice_pdf: pdf_name });
        });
        return pdf_name;
    },

    newVersionBuyerInvoice: async (itemsShopping, cart, OrderNumber, version, id) => {
        let _orderNumber = parseInt(OrderNumber.toString().replace(/,/g, '')) + '-R' +version;
        let html = await processData(itemsShopping, cart, _orderNumber, 0, false, 'invoice_rx');
        let pdf_name = `${getName(OrderNumber, cart)}-R${version}.pdf`;
        await pdf.create(html).toFile(`./pdf_invoices/${pdf_name}`, async () => {
            console.log('pdf done', pdf_name);
            MailerService.sendCartPaidBuyerNotifiedRe(itemsShopping, cart, OrderNumber, pdf_name);
            await ShoppingCartClone.update({ id }, { invoice_pdf: pdf_name });
        });
        return pdf_name;
    },

    buyerInvoiceCOD: async (itemsShopping, cart, OrderNumber, storeName, uaeTaxes) => {
        let html = await processData(itemsShopping, cart, OrderNumber, uaeTaxes, false, 'invoice_cod');
        let pdf_name = getName(OrderNumber, cart);
        await pdf.create(html).toFile(`./pdf_invoices/${pdf_name}`, async () => {
            console.log('pdf done', pdf_name);
            MailerService.sendCartPaidBuyerNotified(itemsShopping, cart, OrderNumber, storeName, pdf_name, OrderNumber);
            await ShoppingCart.update({ id: cart.id }, { invoice_pdf: pdf_name });
        });
        return pdf_name;
    },
    buyerInvoiceCODPaid: async (itemsShopping, cart, OrderNumber, storeName, uaeTaxes) => {
        let html = await processData(itemsShopping, cart, OrderNumber, uaeTaxes, false, 'invoice_cod_paid');
        let pdf_name = 'invoice-delivered-'+getName(OrderNumber, cart);
        await pdf.create(html).toFile(`./pdf_invoices/${pdf_name}`, async () => {
            console.log('pdf done', pdf_name);
            MailerService.sendCartPaidBuyerNotifiedCOD(itemsShopping, cart, OrderNumber, storeName, pdf_name, OrderNumber);
            await ShoppingCart.update({ id: cart.id }, { invoice_pdf: pdf_name });
        });

        return pdf_name;
    },

    sellerPurchaseOrder: async (fullName, cart, itemsShopping, orderNumber, sellerAddress, counter, currentExchangeRate, buyerETA, incoterms, subTotal, total) => {
        itemsShopping = verifiedWholeFishWeight(itemsShopping);
        var compiled = await ejs.compile(fs.readFileSync(__dirname + '/../../pdf_templates/PurchaseOrder.html', 'utf8'));
        //console.log( 'cart', cart );
        //console.log( 'itemsShopping', itemsShopping );
        //let today = cart.paidDatetime;
        var today = new Date();
        var deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 1);
        // date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        let date = today.getDate() + '/' + (today.getMonth() + 1) + '/' + today.getFullYear();
        let date_name = moment().format('MM-DD-YYYY');
        // date2 = deliveryDate.getFullYear() + '-' + (deliveryDate.getMonth() + 1) + '-' + deliveryDate.getDate();
        let date2 = deliveryDate.getDate() + '/' + (deliveryDate.getMonth() + 1) + '/' + deliveryDate.getFullYear();
        let portOfLoading = await sails.helpers.portOfLoadingByCode(itemsShopping[0].fish.processingCountry, itemsShopping[0].fish.city);
        console.log(portOfLoading, "\n\n verver", subTotal, total);
        let paidDateTime = date; //new Date().toISOString();

        //for currency of seller, change prices
        let exchangeRates = Number(cart.currentCharges.exchangeRates);
        let currency = '';
        let calcs = await sails.helpers.calcsPrices.with({
            items: itemsShopping,
            exchangeRates,
            forSeller: true
        });
        currency = calcs.currency;
        itemsShopping = calcs.items;

        //Para obtener el total y parsiar la fecha de pago
        subTotal = currency === 'AED' ? Number(subTotal).toFixed(2) : (Number(subTotal) / exchangeRates).toFixed(2);
        total = currency === 'AED' ? Number(total).toFixed(2) : (Number(total) / exchangeRates).toFixed(2);

        var html = await compiled(
            {
                invoiceDueDate: date2,
                invoiceDate: date2,
                seller_contact_name: fullName,
                seller_contact_address: sellerAddress,
                contactAccountNumber: '100552524900003',
                invoice_number: 'invoice_number',
                purchase_order_date: paidDateTime,
                delivery_order_date: date2,
                invoice_number: itemsShopping[0].orderInvoice,
                purchase_number: counter,
                orderNumber: orderNumber,
                items: itemsShopping,
                // subTotal: parseFloat(itemsShopping.subTotal, 10).toFixed(2),
                // total: parseFloat(cart.total, 10).toFixed(2),
                currentExchangeRate: currentExchangeRate,
                api_url: api_url,
                port_of_loading: portOfLoading.name,
                incoterms,
                subTotal,
                total,
                currency
            }
        );
        let pdf_name = `purchase-order-${orderNumber}-${date_name}-${counter}.pdf`;
        await pdf.create(html).toFile(`./pdf_purchase_order/${pdf_name}`, async () => {
            console.log('pdf done', pdf_name, '\n\n');
            MailerService.sendCartPaidSellerNotified(fullName, cart, itemsShopping, orderNumber, itemsShopping[0].fish.store.owner.email, pdf_name, buyerETA);
            let pdf_updated = await ItemShopping.update({ id: itemsShopping.map(it => { return it.id; }) }, { po_path: pdf_name });
        })
        return pdf_name;
    },
    sendPDF: async (req, res, pdf_directory, pdf_name) => {
        let path = `${sails.config.appPath}/${pdf_directory}/${pdf_name}`;
        try {
            res.download(path, pdf_name);
            console.log(path);
        } catch (error) {
            res.serverError(error);
        }
    }

}
