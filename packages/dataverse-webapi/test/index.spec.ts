import { create, createWithReturnData, WebApiConfig } from '../src/index';

describe('WebApi', () => {
    let config: WebApiConfig;

    beforeEach(() => {
        config = {
            version: '8.2'
        };
    });

    test('create an account', async () => {
        create(config, 'accounts', { name: 'Test Account'});
    });

    test('create an account with returned data', async () => {
        createWithReturnData(config, 'accounts', { name: 'Test Account'}, '$select=accountid');
    });
});