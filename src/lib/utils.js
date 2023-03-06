const url = require('url');
const http = require('http');
const https = require('https');
const kindOf = require('kind-of');
const isXml = require('is-xml');
const xml2js = require('xml2js');
const zlib = require('zlib');

function getEnvVar(name, defaultValue) {

    if (!(name in process.env) && kindOf(defaultValue) === 'undefined')
        throw new Error(`Cannot find missing env variable ${name}`);

    return name in process.env ? process.env[name] : defaultValue;
}

function validateUrl(str) {

    if (!str.startsWith('http://') && !str.startsWith('https://'))
        return false;

    try {

        new url.URL(str);
        return true;

    } catch (error) {

        return false;
    }
}

async function httpCall(method, uri, headers, body) {

    return new Promise((resolve, reject) => {

        let bodySerialized;
        let defaultHeaders = {};
        let agent;

        if (kindOf(body) === 'undefined')
            bodySerialized = null;
        else if (kindOf(body) === 'string')
            bodySerialized = body;
        else
            bodySerialized = JSON.stringify(body);

        if (bodySerialized != null) {

            Object.assign(defaultHeaders, {
                'Content-Length': Buffer.byteLength(bodySerialized)
            });

            if (isJson(bodySerialized)) {

                Object.assign(defaultHeaders, {
                    'Content-Type': 'application/json',
                });

            } else if (isXml(bodySerialized)) {

                Object.assign(defaultHeaders, {
                    'Content-Type': 'application/xml',
                });
            }
        }

        if (uri.startsWith('http://'))
            agent = http;
        else if (uri.startsWith('https://'))
            agent = https;
        else
            throw new Error(`Cannot handle scheme of URI ${uri}`);

        const request = agent.request(uri, {
            method: method,
            headers: {...defaultHeaders, ...(headers || {})}
        }, response => {

            let chunks = [];

            response.on('data', chunk => {

                chunks.push(chunk);
            });

            response.on('end', () => {

                let data = chunks.join('');

                if (data === '') {

                    resolve({
                        code: response.statusCode,
                        headers: response.headers,
                        data: null
                    });

                } else {

                    resolve({
                        code: response.statusCode,
                        headers: response.headers,
                        data: data
                    });
                }
            });
        });

        request.on('error', error => {

            reject(error);
            console.error(error);
        });

        if (bodySerialized != null)
            request.end(bodySerialized);
        else
            request.end();
    });
}

function parseRedirects(redirectsDef) {

    const node = JSON.parse(redirectsDef);

    if (kindOf(node) !== 'array')
        throw new Error('Expect array for redirects list');

    return node
        .map((value) => {

            if (!('clientKey' in value))
                throw new Error('Expect "clientKey" key in redirect entry');

            if (!('target' in value))
                throw new Error('Expect "target" key in redirect entry');

            return {
                'clientKey': value.clientKey,
                'target': value.target
            };
        });
}

function parseCookiesToClear(cookiesDef) {

    const node = JSON.parse(cookiesDef);

    if (kindOf(node) !== 'array')
        throw new Error('Expect array for cookies to clear list');

    return node
        .map((value) => {

            if (!('name' in value))
                throw new Error('Expect "name" key in cookie entry');

            if (!('domain' in value))
                throw new Error('Expect "domain" key in cookie entry');

            if (!('path' in value))
                value.path = '/';

            const result = [
                `${value.name}=`,
                `path=${value.path}`,
                `domain=${value.domain}`,
                `expires=${(new Date(0)).toUTCString()}`
            ];

            if ('xss' in value && Boolean(value.xss)) {

                result.push('SameSite=None');
                result.push('Secure');
            }

            return result;
        })
        .map((value) => value.join('; '));
}

function isJson(value) {

    try {

        JSON.parse(value);

    } catch (error) {

        return false;
    }

    return true;
}

async function getFrontChannelLogoutClientKey(request) {

    const buffer = Buffer.from(request, 'base64');
    const xmlData = zlib.inflateRawSync(buffer).toString();

    return xml2js.parseStringPromise(xmlData).then((data) => {

        return data['saml2p:LogoutRequest']
            ['saml2:Issuer'][0]['_'];
    });
}

module.exports = {
    getEnvVar,
    validateUrl,
    httpCall,
    parseRedirects,
    parseCookiesToClear,
    getFrontChannelLogoutClientKey,
};
