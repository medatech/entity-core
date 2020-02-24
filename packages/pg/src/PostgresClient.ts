import { PoolClient } from "pg"
import { Client } from "@entity-core/datasource"

class PostgresClient extends Client {
    poolClient: PoolClient

    constructor(poolClient: PoolClient) {
        super()
        this.poolClient = poolClient
    }

    query(query: string, variables?: Array<unknown>): Promise<unknown> {
        return this.poolClient.query(query, variables)
    }

    async release(): Promise<void> {
        this.poolClient.release()
    }
}

export default PostgresClient