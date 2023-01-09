describe('Use case: client login fail via nginx', () => {

    it('should have an inactive session at the beginning', async () => {

        await page.goto('http://127.0.0.1:8184/test-client/client-prefix/status');

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Session inactive');
    });

    it('should show the Keycloak login page', async () => {

        await page.goto('http://127.0.0.1:8184/test-client/client-prefix/login');

        await expect(page.title()).resolves.toMatch('Sign in to master');
    });

    it('should reject incorrect credentials', async () => {

        await page.type('#username', 'admin');
        await page.type('#password', 'incorrect-password');
        await page.click('#kc-login');

        await page.waitForNavigation({waitUntil: 'networkidle0'});

        await page.waitForSelector('#input-error', {visible: true});
    });

    it('should have still an inactive session', async () => {

        await page.goto('http://127.0.0.1:8184/test-client/client-prefix/status');

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Session inactive');
    });
});
