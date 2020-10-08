import dataSource from "./dataSource"

async function beforeEachTest(): Promise<void> {
    try {
        const client = await dataSource.getClient()
        // Truncate all the tables
        await client.query(`
        TRUNCATE ec_entity,
                 ec_tenant
                 RESTART IDENTITY
    `)
        await client.query(`ALTER SEQUENCE ec_tenant_id_seq RESTART WITH 1000;`)
        await client.release()
    } catch (ex) {
        console.error(ex)
        throw ex
    }
}

export default beforeEachTest
