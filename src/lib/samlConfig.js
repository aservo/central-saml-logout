const utils = require('./utils');
const fs = require('fs');
const saml = require('passport-saml');
const xml2js = require('xml2js');

async function getDefaultStrategy(idpMetadata, baseUrl, pathPrefix, explicitIssuer) {

    const descriptor = await readDescriptor(idpMetadata);
    const callbackUrl = `${baseUrl}${pathPrefix}/login/callback`;
    const issuer = explicitIssuer ? explicitIssuer : callbackUrl;

    return new saml.Strategy({
        issuer: issuer,
        callbackUrl: callbackUrl,
        entryPoint: getServiceUrl(descriptor, 'SingleSignOnService'),
        logoutUrl: getServiceUrl(descriptor, 'SingleLogoutService'),
        cert: getFirstCert(descriptor),
        identifierFormat: null,
        validateInResponseTo: false,
        disableRequestedAuthnContext: true,
    }, function (profile, done) {

        console.log(`Handle profile: ${JSON.stringify(profile)}`);

        return done(null, profile);
    });
}

async function readDescriptor(urlOrPath) {

    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {

        const result = await utils.httpCall('GET', urlOrPath);

        return xml2js.parseStringPromise(result.data);
    }

    const xml = await fs.promises.readFile(urlOrPath);

    return xml2js.parseStringPromise(xml);
}

function getServiceUrl(descriptor, key) {

    const entries = descriptor['md:EntityDescriptor']['md:IDPSSODescriptor'][0]['md:' + key];

    for (let i = 0; i < entries.length; i++)
        if (entries[i]['$']['Binding'].endsWith(':HTTP-Redirect'))
            return entries[i]['$']['Location'];

    throw new Error('Cannot find service URL');
}

function getFirstCert(descriptor) {

    return descriptor['md:EntityDescriptor']
        ['md:IDPSSODescriptor'][0]
        ['md:KeyDescriptor'][0]
        ['ds:KeyInfo'][0]
        ['ds:X509Data'][0]
        ['ds:X509Certificate'][0];
}

module.exports = {
    getDefaultStrategy,
};
