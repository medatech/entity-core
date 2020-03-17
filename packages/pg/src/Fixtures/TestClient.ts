import { MockClient, MockDataSource } from "@entity-core/mock"
import { Client, DataSource } from "@entity-core/datasource";

const TEST_ENV = process.env.TEST_ENV

let client: Client = null
let dataSource: DataSource = null

if (TEST_ENV === 'unit') {
    client = new MockClient()
    dataSource = new MockDataSource(client)
} else {
    throw new Error("TEST_ENV not set to: unit, integration")
}

export { client, dataSource }