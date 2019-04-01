var nodeMailer = require("nodemailer");
var Email = require('email-templates');
const ADMIN_EMAIL = sails.config.custom.adminEmails, webappUrl = sails.config.custom.webappUrl;
console.log( 'custom', sails.config.custom.adminEmails );
const APP_NAME = sails.config.APP_NAME;
const config = sails.config.mailer;
const sender = config.auth.user;
const emailSender = 'Seafoodsouq <do-not-reply@seafoodsouq.com>';

//El url base del api, segun su enviroment
const URL = sails.config.custom.baseUrl, 
logoSrc = URL + "/images/logo_email.png";

//El json default que se usa en los correos como emails y logos
const DEFAULT = {
    logoSrc,
    emailSeller: "sellers@seafoodsouq.com",
    emailInfo: 'info@seafoodsouq.com',
    FAQLink: `${webappUrl}`,
    url: URL,
    contactUs: URL + '/login',
};

//Para asignar variables globales en los datas de los mailers
async function applyExtend(data, byPass) {
    let _data = _.extend(data, DEFAULT);
    byPass = byPass || [];
    return await sails.helpers.propMap(_data, byPass);
}

//Para asignar un formato de las fechas de pago global en las ordenes
//format to style of moment -> https://momentjs.com/docs/#/parsing/string-format/
// const formatPaidDate = "DD/MM/YYYY";

const transporter = nodeMailer.createTransport({
    host: config.host,
    port: 465,
    //secure: true, // true for 465, false for other ports
    auth: config.auth,
    tls: {
        rejectUnauthorized: false
    }
});

const email = new Email({
    message: {
        from: emailSender,
    },
    transport: {
        jsonTransport: true
    },
    views: {
        options: {
            extension: 'ejs' // <---- HERE for enable "ejs" engine, if not the app will use "pug" by default
        }
    }
});

async function formatDates(d) {
    let date = new Date(d)
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    // get time am or pm
    let hours = date.getHours()
    let min = date.getMinutes();
    let dates = months[date.getMonth()] + '/' + date.getDate() + '/' + date.getFullYear() + '/' + hours + ':' + min;
    return dates
};

module.exports = {
    registerNewUser: async (user) => {
        email.render('../email_templates/register_new_user',
            await applyExtend({
                name: user.firstName + ' ' + user.lastName,
                id: user.id,
                code: user.code
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: user.email,
                    subject: 'Your Account is Under Review',
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    newUserNotification: async (name, emailAddress, role, company) => {
        let roleType;
        if (role == 0) {
            roleType = "Admin"
        } else if (role == 1) {
            roleType = "Seller"
        } else { roleType = "Buyer" }
        email.render('../email_templates/new_user_admin_notification',
            await applyExtend({
                name,
                email: emailAddress,
                role: roleType,
                company
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: ADMIN_EMAIL,
                    subject: `New ${roleType} is pending confirmation`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendApprovedEmail: async (id, emailAddress, code, name) => {
        
        email.render('../email_templates/approved_account',
            await applyExtend({
                name: name
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: emailAddress,
                    subject: 'Welcome Onboard, Getting Started with Seafood Souq !',
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendApprovedBuyerEmail: async (id, emailAddress, code, name) => {
        email.render('../email_templates/approved_account_buyer',
            await applyExtend({
                name: name,
                id,
                code
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: emailAddress,
                    subject: 'Welcome Onboard, Getting Started with Seafood Souq !',
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendApprovedSellerEmail: async (emailAddress, name) => {
        email.render('../email_templates/approved_seller',
            await applyExtend({
                name: name
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: emailAddress,
                    subject: 'Your Next Steps to Sell On Seafood Souq',
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendRejectedEmail_Type1: async (emailAddress, role, name, denialMessage, emailContact) => {
        email.render('../email_templates/rejected_user1',
            await applyExtend({
                name: name,
                message: denialMessage,
                roleType: role,
                emailContact
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: emailAddress,
                    subject: 'Update - Seafood Souq Account',
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendRejectedEmail_Type2: async (emailAddress, role, name, denialMessage, emailContact) => {
        email.render('../email_templates/rejected_user',
            await applyExtend({
                name: name,
                message: denialMessage,
                roleType: role,
                emailContact
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: emailAddress,
                    subject: 'Update - Seafood Souq Account',
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendEmailForgotPassword: async (emailAddress, code, name) => {
        email.render('../email_templates/forgot_password',
            await applyExtend({
                code: code,
                name: name,
                webAppUrl: webappUrl
            }, ["code"])
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: emailAddress,
                    subject: 'Password Recovery for Seafood Souq',
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendDataFormContactToSeller: async (emailAddress, nameSeller, nameBuyer, emailBuyer, message) => {
        email.render('../email_templates/contact_message',
            await applyExtend({
                nameBuyer: nameBuyer,
                nameSeller: nameSeller,
                message: message,
                emailBuyer: emailBuyer
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: emailAddress,
                    subject: 'New Message of Contact in Seafood Souq',
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    newProductAddedAdminNotified: async (product, seller) => {
        email.render('../email_templates/new_product_awaiting_review',
            await applyExtend({
                name: seller.firstName + ' ' + seller.lastName,
                product: product
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: ADMIN_EMAIL,
                    subject: `Product #${product.seafood_sku} is awaiting Review`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    newProductAddedSellerNotified: async (product, seller) => {
        email.render('../email_templates/new_product_seller_notified',
            await applyExtend({
                name: seller.firstName + ' ' + seller.lastName,
                product: product
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: seller.email,
                    subject: `Product #${product.seafood_sku} is Under Review `,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    newProductRejected: async (seller, product, SFSAdminFeedback) => {
        email.render('../email_templates/new_product_rejected',
            await applyExtend({
                name: seller.firstName + ' ' + seller.lastName,
                product: product,
                SFSAdminFeedback: SFSAdminFeedback
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: seller.email,
                    subject: `Product #${product.seafood_sku} is awaiting Review`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    newProductAccepted: async (seller, product) => {
        email.render('../email_templates/new_product_accepted',
            await applyExtend({
                name: seller.firstName + ' ' + seller.lastName,
                product: product
            })
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: seller.email,
                    subject: `Product #${product.seafood_sku} is awaiting Review`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendCartPaidSellerNotified: async (sellerName, cart, items, orderNumber, emailAddress, sellerInvoice, buyerETA) => {

        let buyerExpectedDeliveryDate = items.buyerExpectedDeliveryDate.split("/");
        let buyerDate = new Date(buyerExpectedDeliveryDate[2], buyerExpectedDeliveryDate[0], buyerExpectedDeliveryDate[1]);
        items.buyerExpectedDeliveryDate = await sails.helpers.formatDate(buyerDate);
        items = Object.prototype.toString.call(items) === '[object Object]' ? [items] : items;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName,
            cart,
            items,
            orderNumber,
            type: "sendCartPaidSellerNotified"
        });
        data.buyerETA = buyerETA;
        email.render('../email_templates/cart_paid_seller_notified',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: emailAddress,
                    subject: `Order #${orderNumber} is Placed`,
                    html: res, // html body
                    attachments: [
                        {
                            filename: sellerInvoice,
                            path: `pdf_purchase_order/${sellerInvoice}`
                        }
                    ]
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendCartPaidBuyerNotified: async (items, cart, orderNumber, stores, pdf_invoice, invoiceNumber) => {
        let store, storeLng = stores.length;
        for (let [index, value] of stores.entries()) {
            if (index == 0) {
                if (storeLng > 1) {
                    store = value + ' and ';
                }
                else {
                    store = value;
                }
            } else {
                if (index == storeLng - 1) {
                    store += value
                } else {
                    store += value + ' and '
                }
            }
        }
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: cart.buyer.firstName + " " + cart.buyer.lastName,
            cart,
            items,
            orderNumber,
            type: "sendCartPaidBuyerNotified"
        });
        email.render('../email_templates/cart_paid_buyer_notified',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: cart.buyer.email,
                    subject: `Order #${orderNumber} is Placed`,
                    html: res, // html body
                    attachments: [
                        {
                            filename: `seafood-invoice-${orderNumber}.pdf`,
                            path: `pdf_invoices/${pdf_invoice}`
                        }
                    ]
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sendCartPaidAdminNotified: async (items, cart, orderNumber, stores) => {
        let store, storeLng = stores.length;
        for (let [index, value] of stores.entries()) {
            if (index == 0) {
                if (storeLng > 1) {
                    store = value + ' and ';
                }
                else {
                    store = value;
                }
            } else {
                if (index == storeLng - 1) {
                    store += value
                } else {
                    store += value + ' and '
                }
            }
        }
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: cart.buyer.firstName + " " + cart.buyer.lastName,
            cart,
            items,
            orderNumber,
            type: "sendCartPaidAdminNotified"
        });
        email.render('../email_templates/cart_paid_admin_notified',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: ADMIN_EMAIL,
                    subject: `Order #${orderNumber} is Placed`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    buyerCancelledOrderBuyer: async (name, cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "buyerCancelledOrderBuyer"
        });
        data.store = store
        email.render('../email_templates/buyer_cancelled_order',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: cart.buyer.email,
                    subject: `Order #${cart.orderNumber} is Cancelled`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    buyerCancelledOrderSeller: async (cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: store.owner.firstName + ' ' + store.owner.lastName,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "buyerCancelledOrderSeller"
        });
        email.render('../email_templates/buyer_cancelled_order_seller',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: store.owner.email,
                    subject: `Order #${cart.orderNumber} is Cancelled`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    buyerCancelledOrderAdmin: async (cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: "",
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "buyerCancelledOrderAdmin"
        });
        data.store = store;
        email.render('../email_templates/buyer_cancelled_order_admin',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: ADMIN_EMAIL,
                    subject: `Order #${cart.orderNumber} is Cancelled`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sellerCancelledOrderBuyer: async (name, cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "buyerCancelledOrderAdmin"
        });
        data.store = store;
        email.render('../email_templates/seller_cancelled_order_buyer',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: cart.buyer.email,
                    subject: 'Your Order has been cancelled !',
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sellerCancelledOrderSeller: async (name, emailSeller, cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "sellerCancelledOrderSeller"
        });
        data.store = store;
        email.render('../email_templates/seller_cancelled_order_seller',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: emailSeller,
                    subject: `Order #${cart.orderNumber} is Cancelled`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sellerCancelledOrderAdmin: async (name, nameSeller, cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "sellerCancelledOrderAdmin"
        });
        data.store = store;
        data.nameSeller = nameSeller;
        email.render('../email_templates/seller_cancelled_order_admin',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: ADMIN_EMAIL,
                    subject: `Order #${cart.orderNumber} is Cancelled`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    itemShipped: async (name, cart, store, item) => {

        
        let sellerExpectedDeliveryDate = item.sellerExpectedDeliveryDate.split("/");
        let sellerDate = new Date(sellerExpectedDeliveryDate[2], sellerExpectedDeliveryDate[0], sellerExpectedDeliveryDate[1]);
        sellerExpectedDeliveryDate = await sails.helpers.formatDate(sellerDate);

        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "itemShipped"
        });
        data.store = store;
        data.sellerExpectedDeliveryDate = sellerExpectedDeliveryDate;
        email.render('../email_templates/itemShipped',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: cart.buyer.email,
                    subject: `Order #${cart.orderNumber} is being Shipped`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    orderArrived: async (name, cart, store, item) => {
        let paidDateTime = new Date(cart.paidDateTime);
        let sellerExpectedDeliveryDate = item.sellerExpectedDeliveryDate.split("/");
        let sellerDate = new Date(sellerExpectedDeliveryDate[2], sellerExpectedDeliveryDate[0], sellerExpectedDeliveryDate[1]);
        
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "orderArrived"
        });
        data.sellerExpectedDeliveryDate = await sails.helpers.formatDate(sellerDate);
        data.store = store;
        email.render('../email_templates/order_arrived',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: cart.buyer.email,
                    subject: `Order #${cart.orderNumber} has arrived in Dubai !`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    orderDeliveredBuyer: async (name, cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "orderDeliveredBuyer"
        });
        data.store = store;
        email.render('../email_templates/order_delivered_buyer',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: cart.buyer.email,
                    subject: `Order #${cart.orderNumber} is Delivered !`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    orderOutForDelivery: async (name, cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "orderOutForDelivery"
        });
        data.store = store;
        email.render('../email_templates/order_out_for_delivery_buyer',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: cart.buyer.email,
                    subject: `Order #${cart.orderNumber} is out for Delivery!`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    orderArrivedSeller: async (name, cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "orderArrivedSeller"
        });
        data.store = store;
        email.render('../email_templates/order_delivered_seller',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: store.owner.email,
                    subject: `Order #${cart.orderNumber} is Delivered !`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    buyerRefund: async (name, cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "buyerRefund"
        });
        data.store = store;
        email.render('../email_templates/refund_buyer',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: cart.buyer.email,
                    subject: `Refund #${cart.orderNumber} completed !`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
    sentAdminWarningETA: async (cart, store, item, buyer, sellerExpectedDeliveryDate) => {
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: "",
            cart,
            items: [item],
            orderNumber: item.orderInvoice,
            type: "sentAdminWarningETA"
        });
        data.sellerName = store.owner.firstName + ' ' + store.owner.lastName;
        data.buyerName = buyer;
        data.sellerExpectedDeliveryDate = sellerExpectedDeliveryDate;
        email.render('../email_templates/admin_warning_ETA',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: ADMIN_EMAIL,
                    subject: `ETA Warning`,
                    html: res
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })
            })

    },
    orderSellerPaid: async (name, cart, store, item) => {
        item = item.typeObject() === 'object' ? [item] : item;
        let data = await sails.helpers.getDataOrder.with({
            URL,
            sellerName: name,
            cart,
            items: item,
            orderNumber: cart.orderNumber,
            type: "orderSellerPaid"
        });
        data.store = store;
        email.render('../email_templates/order_seller_paid',
            await applyExtend(data)
        )
            .then(res => {
                transporter.sendMail({
                    from: emailSender,
                    to: store.owner.email,
                    subject: `Order #${cart.orderNumber} payment initiated !`,
                    html: res, // html body
                }, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    return 'Message sent: %s', info.messageId;
                })

            })
            .catch(
                console.error
            )
    },
}
