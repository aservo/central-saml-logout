const utils = require('./utils');
const actions = require('./actions');
const crypto = require('crypto');
const dotenv = require('dotenv');
const {Command, Option} = require('commander');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const saml = require('passport-saml');
const pkg = require('../package.json');
const config = require('./config.json');

async function boot() {

    const cookiesToClear = utils.parseCookiesToClear(utils.getEnvVar('COOKIES_TO_CLEAR', ''));
    const descriptor = await utils.readDescriptor(utils.getEnvVar('IDP_METADATA'));
    const callbackUrl = `${utils.getEnvVar('BASE_URL')}/${pkg.name}/login/callback`;
    const issuer = utils.getEnvVar('ISSUER', callbackUrl);

    const strategy = new saml.Strategy({
        issuer: issuer,
        callbackUrl: callbackUrl,
        entryPoint: utils.getServiceUrl(descriptor, 'SingleSignOnService'),
        logoutUrl: utils.getServiceUrl(descriptor, 'SingleLogoutService'),
        cert: utils.getFirstCert(descriptor),
        identifierFormat: null,
        validateInResponseTo: false,
        disableRequestedAuthnContext: true,
    }, function (profile, done) {

        console.log(`Handle user: ${profile.nameID} (${profile.nameIDFormat})`)

        return done(null, profile);
    });

    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        done(null, user);
    });

    passport.use(strategy);

    const app = express();

    app.use(bodyParser());
    app.use(cookieParser());
    app.use(session({secret: crypto.randomBytes(128).toString('hex')}));
    app.use(passport.initialize());
    app.use(passport.session());

    actions.setup(app, strategy, cookiesToClear);

    app.listen(utils.getEnvVar('SERVER_PORT'), utils.getEnvVar('SERVER_HOSTNAME'), function () {
        console.log(`Listening at ${utils.getEnvVar('APP_HOST')}:${utils.getEnvVar('APP_PORT')}`)
    });
}

async function main() {

    dotenv.config();

    const program = new Command();

    program
        .version(pkg.version)
        .description(pkg.description);

    // add cli parameters
    config.options.forEach((x) => {

        if (x.default == null)
            program.addOption(new Option(x.parameter, x.description).env(x.mapping.env));
        else
            program.addOption(new Option(x.parameter, x.description).default(x.default).env(x.mapping.env));
    });

    // parse cli arguments
    program.parse();

    // put arguments into process.env
    for (const [key, value] of Object.entries(program.opts())) {

        const entry = config.options.find((x) => x.mapping.key === key);

        process.env[entry.mapping.env] = value;
    }

    await boot();
}

if (require.main === module) {

    utils.logError(main());
}

module.exports = {
    boot,
    main,
};
