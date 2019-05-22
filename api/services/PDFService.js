var fs = require('fs');
var ejs = require('ejs');
var pdf = require('html-pdf')
var api_url = sails.config.custom.baseUrl;

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
    }else if(items.typeObject() === "object"){
        if (items.isDefined("wholeFishWeight") === false) {
            items.wholeFishWeight = "";
        }
    }

    return items;
};

module.exports = {
    buyerInvoice: async (itemsShopping, cart, OrderNumber, storeName, uaeTaxes) => {
        itemsShopping = verifiedWholeFishWeight(itemsShopping);
        console.log('dir name', __dirname);
        var compiled = await ejs.compile(fs.readFileSync(__dirname + '/../../pdf_templates/invoice.html', 'utf8'));
        console.log('cart', cart);
        //console.log( 'itemsShopping', itemsShopping );
        //let today = cart.paidDatetime;
        let today = new Date();
        // date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
	    date = today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear();
        let paidDateTime = date;
        var html = await compiled(
            {
                invoiceDueDate: paidDateTime,
                invoiceDate: paidDateTime,
                buyerContactName: cart.buyer.firstName + ' ' + cart.buyer.lastName,
                buyerContactPostalAddress: `${cart.buyer.dataExtra.Address}, ${cart.buyer.dataExtra.City}, ${cart.buyer.dataExtra.country}, ${cart.buyer.dataExtra.zipCode}`,
                contactAccountNumber: '100552524900003',
                InvoiceNumber: 'InvoiceNumber',
                vat: cart.buyer.dataExtra.vat || 0,
                purchase_order_date: paidDateTime,
                delivery_order_date: paidDateTime,
                invoice_number: OrderNumber,
                orderNumber: OrderNumber,
                items: itemsShopping,
                subTotal: parseFloat(cart.subTotal, 10).toFixed(2),
                customHandlingFee: cart.totalOtherFees,
                uaeTaxesFee: cart.uaeTaxes,
                shippingFees: cart.shipping,
                total: parseFloat(cart.total).toFixed(2),
                uaeTaxes: uaeTaxes,
                api_url: api_url
            }
        );
        let pdf_name = `invoice-order-${OrderNumber}.pdf`;
        await pdf.create(html).toFile(`./pdf_invoices/${pdf_name}`, async () => {
            console.log('pdf done', pdf_name);
            MailerService.sendCartPaidBuyerNotified(itemsShopping, cart, OrderNumber, storeName, `invoice-order-${OrderNumber}.pdf`, OrderNumber);
            let pdf_updated_1 = await ShoppingCart.update({ id: cart.id }, { invoice_pdf: pdf_name });
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
	    date = today.getDate()+'/'+(today.getMonth()+1)+'/'+today.getFullYear();
	    date_name = date.split('/').join('-');
        // date2 = deliveryDate.getFullYear() + '-' + (deliveryDate.getMonth() + 1) + '-' + deliveryDate.getDate();
	    date2 = deliveryDate.getDate() + '/' + (deliveryDate.getMonth()+1) + '/' + deliveryDate.getFullYear();
        let portOfLoading = await sails.helpers.portOfLoadingByCode(itemsShopping[0].fish.processingCountry, itemsShopping[0].fish.city);
        console.log(portOfLoading, "\n\n verver", subTotal, total);
        let paidDateTime = date; //new Date().toISOString();
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
                invoice_number: itemsShopping.orderInvoice,
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
                total
            }
        );
        let pdf_name = `purchase-order-${orderNumber}-${date_name}-${counter}.pdf`;
        await pdf.create(html).toFile(`./pdf_purchase_order/${pdf_name}`, async () => {
            console.log('pdf done', pdf_name);
            MailerService.sendCartPaidSellerNotified(fullName, cart, itemsShopping, orderNumber, itemsShopping[0].fish.store.owner.email, pdf_name, buyerETA);
            let pdf_updated = await ItemShopping.update({ id: itemsShopping.id }, { po_path: pdf_name });
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
