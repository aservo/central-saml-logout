const http = require('http');
const kindOf = require('kind-of');
const isXml = require('is-xml');

function getEnvVar(name, defaultValue) {

    if (!(name in process.env) && kindOf(defaultValue) === 'undefined')
        throw new Error(`Cannot find missing env variable ${name}`);

    return name in process.env ? process.env[name] : defaultValue;
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

module.exports = {
    getEnvVar,
    httpCall,
    parseCookiesToClear,
};
