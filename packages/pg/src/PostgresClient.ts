import { PoolClient } from "pg"
import { Client } from "@entity-core/datasource"
import { DataSource } from "@entity-core/datasource"

class PostgresClient extends Client {
    dataSource: DataSource
    poolClient: PoolClient

    constructor(poolClient: PoolClient, dataSource: DataSource) {
        super()
        this.poolClient = poolClient
        this.dataSource = dataSource
    }

    query(query: string, variables?: Array<unknown>): Promise<unknown> {
        return this.poolClient.query(query, variables)
    }

    async release(): Promise<void> {
        this.dataSource.deregisterClient(this)
        this.poolClient.release()
    }

    async on(event: string, callback: (query: string, variables: Array<unknown>) => unknown): Promise<void> {
        return
    }
}

export default PostgresClient