import { DataSource } from "@entity-core/datasource"
import { Client } from "@entity-core/datasource"

class MockDataSource extends DataSource {
    client: Client

    constructor(client: Client) {
        super()
        this.client = client
    }

    async connect(): Promise<void> { return }

    async disconnect(): Promise<void> { return }

    async getClient(): Promise<Client> {
        return this.client
    }
}

export default MockDataSource