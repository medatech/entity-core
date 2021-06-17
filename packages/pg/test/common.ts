import { Context } from "@entity-core/context"
import PostgresDataSource from "../src/PostgresDataSource"
import PostgresClient from "../src/PostgresClient"
import { __resetNanoid } from "../__mocks__/nanoid"

const dataSource = new PostgresDataSource({
    poolConfig: {
        database: `entity-core`,
        user: `entity-core`,
        password: `root`,
        host: `localhost`,
        port: 18123,
    },
    tablePrefix: `ec_`,
})

const context = {
    current: new Context({
        dataSource,
    }),
}

async function getClient() {
    const client = (await context.current.getDB()) as PostgresClient
    return client
}

async function _beforeAll() {
    await dataSource.connect()
}

async function _afterAll() {
    await dataSource.disconnect()
    context.current.end()
}

async function _beforeEach() {
    await context.current.end() // Stop the previous context
    context.current = new Context({ dataSource })
    __resetNanoid()
    const client = await dataSource.getClient()
    await client.query(
        `TRUNCATE ec_entity, ec_relationship, ec_tenant RESTART IDENTITY`
    )
    await client.query(`ALTER SEQUENCE ec_tenant_id_seq RESTART WITH 1000;`)

    // Add the system entity back
    await client.query(`
        INSERT INTO "ec_entity"
        (tenant_id, entity_type, uuid, props, parent, parent_type, previous)
        VALUES
        (1, 'System', 'system', null, null, null, null);
    `)
}

export { context, dataSource, getClient, _beforeAll, _afterAll, _beforeEach }
