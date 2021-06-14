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

const context = new Context({
    dataSource,
})

async function getClient() {
    const client = (await context.getDB()) as PostgresClient
    return client
}

async function _beforeAll() {
    await dataSource.connect()
}

async function _afterAll() {
    await dataSource.disconnect()
}

async function _beforeEach() {
    __resetNanoid()
    const client = await dataSource.getClient()
    await client.query(
        `truncate ec_entity, ec_relationship, ec_tenant RESTART IDENTITY`
    )
}

export { context, dataSource, getClient, _beforeAll, _afterAll, _beforeEach }
