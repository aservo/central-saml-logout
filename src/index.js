const pkg = require('../package.json');
const config = require('./config.json');
const utils = require('./lib/utils');
const samlConfig = require('./lib/samlConfig');
const actions = require('./actions');
const crypto = require('crypto');
const dotenv = require('dotenv');
const {Command, Option} = require('commander');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('cookie-session');
const passport = require('passport');

async function boot() {

    const sessionMaxAge = parseInt(utils.getEnvVar('SESSION_MAX_AGE')); // default is one day
    const redirects = utils.parseRedirects(utils.getEnvVar('REDIRECTS'));
    const cookiesToClear = utils.parseCookiesToClear(utils.getEnvVar('COOKIES_TO_CLEAR'));

    const idpMetadata = utils.getEnvVar('IDP_METADATA');
    const baseUrl = utils.getEnvVar('BASE_URL');
    const pathPrefix = utils.getEnvVar('PATH_PREFIX', '');
    const explicitIssuer = utils.getEnvVar('ISSUER', null);

    const app = express();
    const strategy = await samlConfig.getDefaultStrategy(idpMetadata, baseUrl, pathPrefix, explicitIssuer);

    passport.serializeUser(function (user, done) {
        done(null, user);
    });

    passport.deserializeUser(function (user, done) {
        done(null, user);
    });

    passport.use(strategy);

    app.use(bodyParser());
    app.use(session({
        name: `${pkg.name}-session${pathPrefix.replaceAll('/', '-')}`,
        maxAge: sessionMaxAge * 1000,
        secret: crypto.randomBytes(128).toString('hex')
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    actions.setup(app, strategy, redirects, cookiesToClear);

    app.listen(utils.getEnvVar('SERVER_PORT'), utils.getEnvVar('SERVER_HOSTNAME'), function () {
        console.log(`Listening at ${utils.getEnvVar('SERVER_HOSTNAME')}:${utils.getEnvVar('SERVER_PORT')}`);
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

    main()
        .catch((error) => {

            console.error(`An error occurred during execution`);
            console.error(error);

            process.exitCode = 1;
        });
}

module.exports = {
    boot,
    main,
};
