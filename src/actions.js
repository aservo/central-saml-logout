const utils = require('./utils');
const passport = require('passport');
const pkg = require('../package.json');

function setup(app, strategy, cookiesToClear) {

    const logoutSuccessRedirect = utils.getEnvVar('FALLBACK_LOGOUT_URL', `/${pkg.name}/logout/success`);
    const loginSuccessRedirect = utils.getEnvVar('LOGIN_SUCCESS_URL', `/${pkg.name}/login/success`);
    const loginFailureRedirect = utils.getEnvVar('LOGIN_FAILURE_URL', `/${pkg.name}/login/failure`);

    const ensureAuthenticated = (request, response, next) => {

        if (request.isAuthenticated())
            return next();
        else
            return response.redirect(`/${pkg.name}/login`);
    };

    const logoutInit = (request, response, next) => {

        const queryStringIndex = request.url.indexOf('?');

        if (queryStringIndex >= 0 && queryStringIndex < request.url.length - 1)
            request.session.logoutRedirectUrl = request.url.slice(queryStringIndex + 1);

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

            const redirectUrl = 'logoutRedirectUrl' in request.session ? request.session.logoutRedirectUrl : null;

            await utils.httpCall('GET', logoutRequestUrl);
            request.logout();
            request.session.destroy();

            cookiesToClear.forEach((cookie) => {

                response.setHeader('Set-Cookie', cookie);
            });

            if (redirectUrl)
                response.redirect(redirectUrl);
            else
                response.redirect(logoutSuccessRedirect);
        });
    };

    app.get(`/${pkg.name}/metadata`, (request, response) => {

        response.type('application/xml');
        response.status(200).send(strategy.generateServiceProviderMetadata());
    });

    app.post(`/${pkg.name}/login/callback`, login, (request, response) => {

        if ('flow' in request.session && request.session.flow === 'logout')
            response.redirect(`/${pkg.name}/logout`);
        else
            response.redirect(loginSuccessRedirect);
    });

    app.get(`/${pkg.name}/login`, login);

    app.post(`/${pkg.name}/login`, login);

    app.get(`/${pkg.name}/logout`, logoutInit, ensureAuthenticated, logout);

    app.post(`/${pkg.name}/logout`, logoutInit, ensureAuthenticated, logout);

    app.get(`/${pkg.name}/logout/success`, (request, response) => {

        response.status(200).send('Logout was successful');
    });

    app.get(`/${pkg.name}/login/success`, (request, response) => {

        response.status(200).send('Login was successful');
    });

    app.get(`/${pkg.name}/login/failure`, (request, response) => {

        response.status(401).send('Login failed');
    });
}

module.exports = {
    setup,
};
