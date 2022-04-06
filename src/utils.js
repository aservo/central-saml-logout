const fs = require('fs');
const http = require('http');
const kindOf = require('kind-of');
const xml2js = require("xml2js");
const isXml = require('is-xml');

function getEnvVar(name, defaultValue) {

    if (!(name in process.env) && kindOf(defaultValue) === 'undefined')
        throw new Error(`Cannot find missing env variable ${name}`);

    return name in process.env ? process.env[name] : defaultValue;
}

function logError(promise) {

    promise
        .catch((error) => {

            console.error(`An error occurred when executing the application`);
            console.error(error);

            process.exitCode = 1;
        });
}

async function httpCall(method, uri, headers, body) {

    return new Promise((resolve, reject) => {

        let bodySerialized;
        let defaultHeaders = {};

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

        const request = new http.request(uri, {
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

function parseCookiesToClear(def) {

    return def.split('|')
        .map((value) => value.trim())
        .filter((value) => value.length !== 0)
        .map((value) => {

            return Object.fromEntries(value.split(';')
                .map((x) => x.trim())
                .filter((x) => x.indexOf('=') !== -1)
                .map((x) => {

                    const i = x.indexOf('=');

                    return [x.slice(0, i), x.slice(i + 1)]
                })
            );
        })
        .map((value) => {

            if (!('name' in value))
                throw new Error('Expect "name" key in cookie entry');

            if (!('domain' in value))
                throw new Error('Expect "domain" key in cookie entry');

            if (!('path' in value))
                value.path = '/';

            return [
                `${value.name}=`,
                `path=${value.path}`,
                `domain=${value.domain}`,
                `expires=${(new Date(0)).toUTCString()}`
            ];
        })
        .map((value) => value.join('; '))
}

async function readDescriptor(urlOrPath) {

    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {

        const result = await httpCall('GET', urlOrPath);

        return xml2js.parseStringPromise(result.data);
    }

    const xml = await fs.promises.readFile(urlOrPath)

    return xml2js.parseStringPromise(xml);
}

function getServiceUrl(descriptor, key) {

    const entries = descriptor['md:EntityDescriptor']['md:IDPSSODescriptor'][0]['md:' + key];

    for (let i = 0; i < entries.length; i++)
        if (entries[i]['$']['Binding'].endsWith(':HTTP-Redirect'))
            return entries[i]['$']['Location']

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

function isJson(value) {

    try {

        JSON.parse(value);

    } catch (error) {

        return false;
    }

    return true;
}

module.exports = {
    getEnvVar,
    logError,
    httpCall,
    parseCookiesToClear,
    readDescriptor,
    getServiceUrl,
    getFirstCert,
};
