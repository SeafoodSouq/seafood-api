const credentials = require("../../config/local").docusing;
const docusign = require("docusign-esign");

module.exports = {
    sentTemplate: async (req, res) => {
        try {
            //Establecemos que es un demo
            var oAuth = docusign.ApiClient.OAuth;
            var restApi = docusign.ApiClient.RestApi;
            var basePath = restApi.BasePath.DEMO;
            var oAuthBasePath = oAuth.BasePath.DEMO;

            var apiClient = new docusign.ApiClient({
                basePath: basePath,
                oAuthBasePath: oAuthBasePath
            });
            docusign.Configuration.default.setDefaultApiClient(apiClient);

            //Añadimos la authenticacion
            // create JSON formatted auth header
            let creds = JSON.stringify({
                Username: credentials.email,
                Password: credentials.password,
                IntegratorKey: credentials.integratorKey
            });
            apiClient.addDefaultHeader('X-DocuSign-Authentication', creds);


            // create a new envelope object that we will manage the signature request through
            var envDef = new docusign.EnvelopeDefinition();
            envDef.emailSubject = 'Contract of Seafood Souq';
            envDef.templateId = credentials.templateID;
            // envDef.email = true;
            // envDef.emailAddress = 'jos.ojiron@gmail.com';

            // create a template role with a valid templateId and roleName and assign signer info
            let id = req.param("idUser");
            let user = await User.findOne({ id });
            if (user === undefined)
                return res.status(404).sent("not fount");

            var tRole = new docusign.TemplateRole();
            tRole.roleName = 'User';
            tRole.name = user.firstName + user.lastName;
            tRole.email = user.email;

            // create a list of template roles and add our newly created role
            var templateRolesList = [];
            templateRolesList.push(tRole);

            // assign template role(s) to the envelope
            envDef.templateRoles = templateRolesList;
            // send the envelope by setting |status| to 'sent'. To save as a draft set to 'created'
            envDef.status = 'sent';

            // use the |accountId| we retrieved through the Login API to create the Envelope
            var accountId = credentials.accountID;

            // instantiate a new EnvelopesApi object
            var envelopesApi = new docusign.EnvelopesApi();

            // call the createEnvelope() API
            envelopesApi.createEnvelope(accountId, { 'envelopeDefinition': envDef }, async function (err, envelopeSummary, response) {
                if (err) {
                    res.serverError(err);
                    return console.error(err);
                }
                let doc = await Docusign.findOne({ user: id, type: "contract" });
                if (doc === undefined) {
                    await Docusign.create({
                        user: id,
                        type: "contract",
                        envelopeId: envelopeSummary.envelopeId,
                        envelope: envelopeSummary
                    });
                } else {
                    await Docusign.create({
                        user: id,
                        type: "resend-contract",
                        envelopeId: envelopeSummary.envelopeId,
                        envelope: envelopeSummary
                    });
                }
                res.json(envelopeSummary);
                console.log('EnvelopeSummary: ' + JSON.stringify(envelopeSummary));
            });

        }
        catch (e) {
            console.error(e);
        }
    },
    resposeEnvelope: async (req, res) => {
        let envelope = req.body.DocuSignEnvelopeInformation.EnvelopeStatus;
        let envelopeId = envelope.EnvelopeID
        let status = envelope.Status.toLowerCase();
        await Docusign.update({ envelopeId }, { status });
        res.status(200);
    }

};

