describe('Use case: client login and redirected logout via apache2', () => {

    it('should have an inactive session at the beginning', async () => {

        await page.goto('http://localhost:8183/test-client/client-prefix/status');

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Session inactive');
    });

    it('should show the Keycloak login page', async () => {

        await page.goto('http://localhost:8183/test-client/client-prefix/login');

        await expect(page.title()).resolves.toMatch('Sign in to master');
    });

    it('should be possible to enter login credentials', async () => {

        await page.type('#username', 'admin');
        await page.type('#password', 'password');
        await page.click('#kc-login');

        await page.waitForNavigation({waitUntil: 'networkidle0'});

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Login was successful');
    });

    it('should have an active session', async () => {

        await page.goto('http://localhost:8183/test-client/client-prefix/status');

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Session active');
    });

    it('should redirect the local client logout', async () => {

        await page.goto('http://localhost:8183/test-client/client-prefix/logout/local');
        await page.waitForNavigation({waitUntil: 'networkidle0'});

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Session inactive');
    });
});
