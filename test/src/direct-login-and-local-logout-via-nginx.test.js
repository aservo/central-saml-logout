describe('Use case: direct login and local logout via nginx', () => {

    it('should have an inactive session at the beginning', async () => {

        await page.goto('http://localhost:8182/slo/app-prefix/status');

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Session inactive');
    });

    it('should show the Keycloak login page', async () => {

        await page.goto('http://localhost:8182/slo/app-prefix/login');

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

        await page.goto('http://localhost:8182/slo/app-prefix/status');

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Session active');
    });

    it('should be possible to logout locally', async () => {

        await page.goto('http://localhost:8182/slo/app-prefix/logout/local');

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Logout was successful');
    });

    it('should have an inactive session again', async () => {

        await page.goto('http://localhost:8182/slo/app-prefix/status');

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Session inactive');
    });

    it('should show have still an active Keycloak session', async () => {

        await page.goto('http://localhost:8182/slo/app-prefix/login');
        await page.waitForNavigation({waitUntil: 'networkidle0'});

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Login was successful');
    });

    it('should be possible to logout via SLO directly', async () => {

        await page.goto('http://localhost:8182/slo/app-prefix/logout');

        const content = await page.$eval('*', x => x.innerText);
        expect(content).toEqual('Logout was successful');
    });
});
