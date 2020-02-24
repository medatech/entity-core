import { DataSource } from "@entity-core/datasource"
import MockClient from './MockClient'

class MockDataSource extends DataSource {
    client: MockClient

    constructor(client: MockClient) {
        super()
        this.client = client
    }

    async connect(): Promise<void> { return }

    async disconnect(): Promise<void> { return }

    async getClient(): Promise<MockClient> {
        return this.client
    }
}

export default MockDataSource