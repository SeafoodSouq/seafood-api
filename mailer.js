const nodemailer = require('nodemailer');
const config = require("./config/local").mailer;
const path = require('path'), fs = require("fs");
const IMAGES = path.join(__dirname, '/images'),
    TEMPLATE = path.join(__dirname, "/template_emails");

// create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: config.host,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: config.auth
});


//#region para enviar codigo enlace para verificacion de correo.

function getTemplateVerificationCode(id, email, code) {

    return new Promise(function (resolve, reject) {
        let body = `
        <div align="center" class="button-container center " style="padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px;">
        <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://138.68.19.227:7000/verification/${id + '/' + code}" style="height:31pt; v-text-anchor:middle; width:150pt;" arcsize="10%" strokecolor="#D61A1A" fillcolor="#D61A1A"><w:anchorlock/><v:textbox inset="0,0,0,0"><center style="color:#ffffff; font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size:16px;"><![endif]-->
        <a href="https://seafood.senorcoders.com/verification/${id + '/' + code}" target="_blank" style="display: block;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #ffffff; background-color: #D61A1A; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; max-width: 200px; width: 160px;width: auto; border-top: 0px solid transparent; border-right: 0px solid transparent; border-bottom: 0px solid transparent; border-left: 0px solid transparent; padding-top: 5px; padding-right: 20px; padding-bottom: 5px; padding-left: 20px; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;mso-border-alt: none">
            <span style="font-size:16px;line-height:32px;"><span style="font-size: 15px; line-height: 30px;" data-mce-style="font-size: 15px;">Confirm Email Address</span></span>
        </a>
        <!--[if mso]></center></v:textbox></v:roundrect></td></tr></table><![endif]-->
    </div>
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
        </div>
        <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
        </div>
        </div>
        </div>    <div style="background-color:transparent;">
        <div style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width: 500px;"><tr class="layout-full-width" style="background-color:transparent;"><![endif]-->

            <!--[if (mso)|(IE)]><td align="center" width="500" style=" width:500px; padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><![endif]-->
        <div class="col num12" style="min-width: 320px;max-width: 500px;display: table-cell;vertical-align: top;">
            <div style="background-color: transparent; width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!--><div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->

                
                <div class="">
        <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;"><![endif]-->
        <div style="color:#555555;line-height:150%;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">	
        <div style="font-size:12px;line-height:18px;color:#555555;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px"><span style="font-size: 15px; line-height: 22px;">If there are any problems with the button, just copy and paste this link in your browser address bar:</span></p><p style="margin: 0;font-size: 14px;line-height: 21px"><span style="font-size: 15px; line-height: 22px; color: rgb(0, 0, 255);">https://seafood.senorcoders.com/verification/${id + '/' + code}</span></p></div>	
        </div>
    `;
        fs.readFile("./template_emails/verification_code_part1.html", "utf8", function (err, data) {
            if (err) { return reject(err); }
            fs.readFile("./template_emails/verification_code_part2.html", "utf8", function (err, data2) {
                if (err) { return reject(err); }
                resolve(data + body + data2);
            });
        });
    });
}

exports.sendCode = async function (id, email, code) {
    try {

        'use strict'
        console.log('sending email to verfication code ' + email);

        let template = await getTemplateVerificationCode(id, email, code);

        nodemailer.createTestAccount((err, account) => {

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"Senorcoders" <milton@senorcoders.com>', // sender address
                to: email, // list of receivers
                subject: `Registration Approved - Seafood Souq`, // Subject line
                text: '', // plain text body
                html: template, // html body
                attachments: [{
                    filename: 'logo.png',
                    path: './template_emails/images/logo.png',
                    cid: 'unique@kreata.ee' //same cid value as in the html img src
                }]
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log(error);
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
            });
        });
    }
    catch (e) {
        console.error(e);
    }
}

//#endregion
function getTemplateUserRevision(id, code,name) {

    return new Promise(function (resolve, reject) {
        let header=`<div class=""><!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 20px; padding-bottom: 20px;"><![endif]--><div style="color:#555555;line-height:120%;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif; padding-right: 10px; padding-left: 10px; padding-top: 20px; padding-bottom: 20px;"><div style="font-size:12px;line-height:14px;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;color:#555555;text-align:left;"><p style="margin: 0;font-size: 12px;line-height: 14px"><span style="font-size: 22px; line-height: 26px; color: rgb(51, 51, 51);"><strong><spanstyle="line-height: 26px; font-size: 22px;">Hey ${name},</span></strong></span></p></div></div><!--[if mso]></td></tr></table><![endif]--></div>`;
        let body = `
        <div align="center" class="button-container center " style="padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px;">
        <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-spacing: 0; border-collapse: collapse; mso-table-lspace:0pt; mso-table-rspace:0pt;"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top:10px; padding-bottom:10px;" align="center"><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="http://138.68.19.227:7000/verification/${id + '/' + code}" style="height:31pt; v-text-anchor:middle; width:150pt;" arcsize="10%" strokecolor="#D61A1A" fillcolor="#D61A1A"><w:anchorlock/><v:textbox inset="0,0,0,0"><center style="color:#ffffff; font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size:16px;"><![endif]-->
        <a href="https://seafood.senorcoders.com/verification/${id + '/' + code}" target="_blank" style="display: block;text-decoration: none;-webkit-text-size-adjust: none;text-align: center;color: #ffffff; background-color: #D61A1A; border-radius: 4px; -webkit-border-radius: 4px; -moz-border-radius: 4px; max-width: 200px; width: 160px;width: auto; border-top: 0px solid transparent; border-right: 0px solid transparent; border-bottom: 0px solid transparent; border-left: 0px solid transparent; padding-top: 5px; padding-right: 20px; padding-bottom: 5px; padding-left: 20px; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;mso-border-alt: none">
            <span style="font-size:16px;line-height:32px;"><span style="font-size: 15px; line-height: 30px;" data-mce-style="font-size: 15px;">Confirm Email Address</span></span>
        </a>
        <!--[if mso]></center></v:textbox></v:roundrect></td></tr></table><![endif]-->
    </div>
            <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
            </div>
        </div>
        <!--[if (mso)|(IE)]></td></tr></table></td></tr></table><![endif]-->
        </div>
        </div>
        </div>    <div style="background-color:transparent;">
        <div style="Margin: 0 auto;min-width: 320px;max-width: 500px;overflow-wrap: break-word;word-wrap: break-word;word-break: break-word;background-color: transparent;" class="block-grid ">
        <div style="border-collapse: collapse;display: table;width: 100%;background-color:transparent;">
        <!--[if (mso)|(IE)]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:transparent;" align="center"><table cellpadding="0" cellspacing="0" border="0" style="width: 500px;"><tr class="layout-full-width" style="background-color:transparent;"><![endif]-->

            <!--[if (mso)|(IE)]><td align="center" width="500" style=" width:500px; padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><![endif]-->
        <div class="col num12" style="min-width: 320px;max-width: 500px;display: table-cell;vertical-align: top;">
            <div style="background-color: transparent; width: 100% !important;">
            <!--[if (!mso)&(!IE)]><!--><div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->

                
                <div class="">
        <!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;"><![endif]-->
        <div style="color:#555555;line-height:150%;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">  
        <div style="font-size:12px;line-height:18px;color:#555555;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 21px"><span style="font-size: 15px; line-height: 22px;color:black">If there are any problems with the button, just copy and paste this link in your browser address bar:</span></p><p style="margin: 0;font-size: 14px;line-height: 21px"><span style="font-size: 15px; line-height: 22px; color: rgb(0, 0, 255);">https://seafood.senorcoders.com/verification/${id + '/' + code}</span></p><p style="margin: 0;font-size: 14px;line-height: 21px"><span style="font-size: 15px; line-height: 22px;color:black">For the meanwhile please have a look at our <a href="https://seafood.senorcoders.com/" style="font-size: 15px; line-height: 22px; color: rgb(0, 0, 255);">Seafood Souq guide</a> to familiarize yourself with our platform and services.</p></div>    
        </div>
    `;
        fs.readFile("./template_emails/admin_confirmation_part1.html", "utf8", function (err, data) {
            if (err) { return reject(err); }
            fs.readFile("./template_emails/admin_confirmation_part2.html", "utf8", function (err, data2) {
                if (err) { return reject(err); }
                fs.readFile("./template_emails/admin_confirmation_part3.html", "utf8",function(err,data3){
                    if(err){return reject(err)}
                    resolve(data + header + data2 + body + data3);
                })
            });
        });
    });
}
exports.registerUserRevision = function (user) {

    return new Promise(async function (resolve, reject) {
        let name=user.firstName+' '+user.lastName;
        let template = await getTemplateUserRevision(user.id, user.code, name);
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Senorcoders" <milton@senorcoders.com>', // sender address
            to: user.email, // list of receivers
            subject: 'Your Account is Under Review',
            text: '',
            html: template,
            attachments: [{
                filename: 'image.png',
                path: './template_emails/images/logo.png',
                cid: 'unique@kreata.ee' //same cid value as in the html img src
            }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                reject(error)
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            resolve();
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });

    });

}

exports.registerUser = async function (fullName, email, password, verificationCode) {

    // setup email data with unicode symbols
    let mailOptions = {
        from: '"Senorcoders" <milton@senorcoders.com>', // sender address
        to: email, // list of receivers
        subject: 'Request Accepted, you password is: ' + password, // Subject line
        text: '',
        html: '<b>Does not have the apk, enter the website, click </b><a href="https://seafood.senorcoders.com/">here</a>' // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });

}

exports.newUserNotification = async function (firstName, lastName, role, email) {
    let roleType;
        if(role==0){
            roleType="Admin"
        }else if(role==1){
            roleType="Seller"
        }else{roleType="Buyer"}
    //Obtenemos el template
    let template = await new Promise((resolve, reject) => {
        let tempt = fs.readFileSync(path.join(TEMPLATE, "verify_new_user1.html"), { encoding: "utf-8" })
        let temp0 = `
        A new ${roleType} has been created and pending review, please Log In into the Admin dashboard to complete the process of reviewing and confirming/rejecting the account. `;
        let temp1 = fs.readFileSync(path.join(TEMPLATE, "verify_new_user2.html"), { encoding: "utf-8" })

        resolve(tempt + temp0 + temp1);
    });

    return new Promise(function (resolve, reject) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Senorcoders" <milton@senorcoders.com>', // sender address
            to: 'brian@senorcoders.com', // "jos.ojiron@gmail.com",
            subject: `New ${roleType} is pending confirmation`, // Subject line
            text: '',
            html: template,
            attachments: [{
                filename: 'image.png',
                path: './template_emails/images/logo.png',
                cid: 'unique@kreata.ee' //same cid value as in the html img src
            }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            resolve();
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });

}

exports.sendEmailForgotPassword = function (email, code) {
    'use strict'
    console.log('sending reset password, email to ' + email);
    let template = fs.readFileSync("./template_emails/change_password.html", { encoding: "utf-8" })
    template = template.replace("$coderesetPassword", code);
    
    nodemailer.createTestAccount((err, account) => {

        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Senorcoders" <milton@senorcoders.com>', // sender address
            to: email, // list of receivers
            subject: 'Password Recovery for Seafood Souq', // Subject line
            text: '', // plain text body
            html: template,
            attachments: [{
                filename: 'image.png',
                path: './template_emails/images/logo.png',
                cid: 'unique@kreata.ee' //same cid value as in the html img src
            }]
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });
}

exports.sendDataFormContactToSeller = function (email, data) {
    'use strict'
    console.log('sending data contact form to email ' + email);

    return new Promise((resolve, reject) => {

        for (let name of Object.keys(data)) {
            if (data[name] === undefined || data[name] === null) {
                throw new Error(`Paramter is Required ${name}`)
            }
        }

        nodemailer.createTestAccount((err) => {

            if (err) { return reject(err) }

            // setup email data with unicode symbols
            let mailOptions = {
                from: '"Senorcoders" <milton@senorcoders.com>', // sender address
                to: email, // list of receivers
                subject: 'New Message of Contact in Seafood Souq', // Subject line
                text: '', // plain text body
                html: `
                    <h2><b>Name:<b> ${data.name}</h2>
                    <h4><b>Email:<b> ${data.email}</h4> <br>
                    <p><b>Message:</b> ${data.message}</p>
                `
            };

            // send mail with defined transport object
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return reject(error);
                }
                console.log('Message sent: %s', info.messageId);
                // Preview only available when sending through an Ethereal account
                console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

                resolve();
                // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
                // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
            });
        });

    });
}

//#region para enviar un correo cuando se haya pagado un carrito de compra

function addItem(item) {
    let itemParser = `
                    <div class="row">
                    <div class="name">${ item.fish.name}</div>
                    <div class="price-unit">${ item.price.type + " " + item.price.value}</div>
                    <div class="quantity">${ item.quantity.type + " - " + item.quantity.value}</div>
                    <div class="subtotal">${ parseFloat(item.quantity.value * item.price.value).toFixed(2)}</div>
                    </div>
                `;

    return itemParser;
}

function calcTotaItem(items) {
    let total = 0;
    for (let it of items) {
        total += it.quantity.value * it.price.value;
    }

    return items[0].price.type + " " + parseFloat(total).toFixed(2);
}

async function getTemplateShopping(items) {

    let head = fs.readFileSync(path.join(TEMPLATE, "purchase_buyer", "purchase_buyer1.html"), { encoding: "utf-8" })
        , footer = fs.readFileSync(path.join(TEMPLATE, "purchase_buyer", "purchase_buyer2.html"), { encoding: "utf-8" });

    let itemsTemplate = "";
    for (let it of items) {
        itemsTemplate += addItem(it);
    }

    let total = `<div class="total">
    <b>total purchased:</b>  <span class="price">${calcTotaItem(items)}</span>
    </div>`;

    return head + itemsTemplate + total + footer;
}

exports.sendCartPaidBuyer = async function (items, email) {


    let template = await getTemplateShopping(items);
    console.log("buyer:: ", email);
    return new Promise(function (resolve, reject) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Senorcoders" <milton@senorcoders.com>', // sender address
            to: email, // list of receivers
            subject: 'Shopping at Seafood Souq', // Subject line
            text: '',
            html: template,
            attachments: [{
                filename: 'image.png',
                path: './template_emails/images/logo.png',
                cid: 'unique@kreata.ee' //same cid value as in the html img src
            }]
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            resolve();
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });
}

exports.sendCartSeller = async function (fullName, fullNameBuyer, emailBuyer, items, email) {
    let msgTitle = `Hey! ${fullName}`,
        msgBeforeItems = "You have sales made for " + fullNameBuyer + ", " + emailBuyer,
        msgAfterItems = "The total of its products sold is";

    let template = await getTemplateShopping(msgTitle, msgBeforeItems, msgAfterItems, items);
    console.log("seller:: ", email);
    return new Promise(function (resolve, reject) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Senorcoders" <milton@senorcoders.com>', // sender address
            to: email, // list of receivers
            subject: 'Shopping at Seafood Souq', // Subject line
            text: '',
            html: template
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            resolve();
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });
}

//#endregion

//#region para enviar correo cuando un pescado esta de camino
async function getTemplateItemShopping(item) {
    let producto = `
    <div style="color:#555555;line-height:120%;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">	
    <div style="font-size:12px;line-height:14px;color:#555555;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 17px">${item.fish.name}</p></div>	
</div>
<!--[if mso]></td></tr></table><![endif]-->
</div>
              
          <!--[if (!mso)&(!IE)]><!--></div><!--<![endif]-->
          </div>
        </div>
          <!--[if (mso)|(IE)]></td><td align="center" width="333" style=" width:333px; padding-right: 0px; padding-left: 0px; padding-top:5px; padding-bottom:5px; border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent;" valign="top"><![endif]-->
        <div class="col num8" style="display: table-cell;vertical-align: top;min-width: 320px;max-width: 328px;">
          <div style="background-color: transparent; width: 100% !important;">
          <!--[if (!mso)&(!IE)]><!--><div style="border-top: 0px solid transparent; border-left: 0px solid transparent; border-bottom: 0px solid transparent; border-right: 0px solid transparent; padding-top:5px; padding-bottom:5px; padding-right: 0px; padding-left: 0px;"><!--<![endif]-->

              
                <div class="">
<!--[if mso]><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;"><![endif]-->
<div style="color:#555555;line-height:120%;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif; padding-right: 10px; padding-left: 10px; padding-top: 10px; padding-bottom: 10px;">	
    <div style="font-size:12px;line-height:14px;color:#555555;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;text-align:left;"><p style="margin: 0;font-size: 14px;line-height: 17px">${item.quantity.type + " - " + item.quantity.value}</p></div>	
</div>
    `;

    return new Promise(function (resolve, reject) {
        fs.readFile("./template_emails/item.html", "utf8", function (err, data) {
            if (err) { return reject(err); }
            fs.readFile("./template_emails/item2.html", "utf8", function (err, data2) {
                if (err) { return reject(err); }
                resolve(data + producto + data2);
            });
        });
    })
}

exports.sendEmailItemRoad = async function (email, trackingID, trackingFile, item) {
    let template = await getTemplateItemShopping(item);
    console.log("item:: ", email);
    if (trackingID !== "") {
        trackingID = ", you tracking ID " + trackingID
    }

    return new Promise(function (resolve, reject) {
        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Senorcoders" <milton@senorcoders.com>', // sender address
            to: email, // list of receivers
            subject: 'Buy In Seafood Souq ' + trackingID, // Subject line
            text: '',
            html: template,
            attachments: [{
                filename: 'image.png',
                path: './template_emails/images/logo.png',
                cid: 'unique@kreata.ee' //same cid value as in the html img src
            }]
        };

        if (trackingFile !== "") {

            let sp = trackingFile.split("/");
            let dirname = path.join(IMAGES, "trackingfile", item.id, sp[sp.length - 2]);
            mailOptions.attachments.push({
                filename: "tracking.png",
                path: dirname,
                cid: 'unique@trkeata.ee'
            });
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return reject(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            resolve();
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@blurdybloop.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });
}

//#endregion