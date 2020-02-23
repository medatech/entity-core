import { PoolClient } from "pg"
import { Client, QueryResult } from "@entity-core/datasource"

class PostgresClient extends Client {
    poolClient: PoolClient

    constructor(poolClient: PoolClient) {
        super()
        this.poolClient = poolClient
    }

    query(query: string, variables?: Array<unknown>): Promise<QueryResult> {
        return this.poolClient.query(query, variables)
    }

    async release(): Promise<void> {
        this.poolClient.release()
    }
}

export default PostgresClient