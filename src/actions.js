const utils = require('./lib/utils');
const passport = require('passport');

function setup(app, strategy, redirects, cookiesToClear) {

    const base = utils.getEnvVar('BASE_URL');
    const prefix = utils.getEnvVar('PATH_PREFIX', '');
    const logoutSuccessRedirect = utils.getEnvVar('FALLBACK_LOGOUT_URL', `${base}${prefix}/logout/success`);
    const loginSuccessRedirect = utils.getEnvVar('LOGIN_SUCCESS_URL', `${base}${prefix}/login/success`);
    const loginFailureRedirect = utils.getEnvVar('LOGIN_FAILURE_URL', `${base}${prefix}/login/failure`);

    const ensureAuthenticated = (request, response, next) => {

        if (request.isAuthenticated())
            return next();
        else
            return response.redirect(`${base}${prefix}/login`);
    };

    const logoutInit = (request, response, next) => {

        const queryStringIndex = request.url.indexOf('?');

        if (queryStringIndex >= 0 && queryStringIndex < request.url.length - 1)
            request.session.clientKey = unescape(request.url.slice(queryStringIndex + 1));

        request.session.flow = 'logout';

        return next();
    };

    const logoutInitSaml = async (request, response, next) => {

        request.session.clientKey = await utils.getFrontChannelLogoutClientKey(request.query['SAMLRequest']);
        request.session.flow = 'logout';

        return next();
    };

    const login = (request, response, next) => {

        const options = {
            failureRedirect: loginFailureRedirect
        };

        return passport.authenticate('saml', options)(request, response, next);
    };

    const logout = (request, response) => {

        strategy.logout(request, async (error, logoutRequestUrl) => {

            if (error)
                console.log(`Cannot perform logout\n${error}`);

            const clientKey = 'clientKey' in request.session ? request.session.clientKey : null;
            const redirectEntry = redirects.find((x) => x.clientKey === clientKey);

            await utils.httpCall('GET', logoutRequestUrl);
            request.logout();
            request.session = null;

            response.setHeader('Set-Cookie', cookiesToClear);

            if (redirectEntry)
                response.redirect(redirectEntry.target);
            else if (clientKey && utils.validateUrl(clientKey))
                response.redirect(clientKey);
            else
                response.redirect(logoutSuccessRedirect);
        });
    };

    const logoutLocal = (request, response) => {

        strategy.logout(request, async (error, _) => {

            if (error)
                console.log(`Cannot perform local logout\n${error}`);

            request.logout();
            request.session = null;

            response.redirect(logoutSuccessRedirect);
        });
    };

    app.get(`${prefix}/metadata`, (request, response) => {

        response.type('application/xml');
        response.status(200).send(strategy.generateServiceProviderMetadata());
    });

    app.post(`${prefix}/login/callback`, login, (request, response) => {

        if ('flow' in request.session && request.session.flow === 'logout')
            response.redirect(`${base}${prefix}/logout`);
        else
            response.redirect(loginSuccessRedirect);
    });

    app.get(`${prefix}/login`, login);

    app.get(`${prefix}/logout`, logoutInit, ensureAuthenticated, logout);

    app.post(`${prefix}/logout`, logoutInit, ensureAuthenticated, logout);

    app.get(`${prefix}/logout/local`, logoutLocal);

    app.post(`${prefix}/logout/local`, logoutLocal);

    app.get(`${prefix}/logout/saml`, logoutInitSaml, ensureAuthenticated, logout);

    app.get(`${prefix}/status`, (request, response) => {

        if (request.isAuthenticated())
            response.status(200).send('Session active');
        else
            response.status(200).send('Session inactive');
    });

    app.get(`${prefix}/logout/success`, (request, response) => {

        response.status(200).send('Logout was successful');
    });

    app.get(`${prefix}/login/success`, (request, response) => {

        response.status(200).send('Login was successful');
    });

    app.get(`${prefix}/login/failure`, (request, response) => {

        response.status(401).send('Login failed');
    });
}

module.exports = {
    setup,
};
