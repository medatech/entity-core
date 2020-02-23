import PostgresDataSource from './PostgresDataSource'

describe('PostgresDataSource', () => {
    test('should allow me to create a data source with a config', () => {
        const config = {
            host: 'localhost',
            user: 'user',
            password: 'dolphins',
            database: 'sandbox'
        }

        const dataSource = new PostgresDataSource({ ...config })
        expect(dataSource.poolConfig).toMatchObject(config)
    })
})