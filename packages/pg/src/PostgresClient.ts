import { PoolClient, QueryResult } from "pg"
import { Client } from "@entity-core/datasource"
import { DataSource } from "@entity-core/datasource"
import { SQLStatement } from "sql-template-strings"

class PostgresClient extends Client {
    dataSource: DataSource
    poolClient: PoolClient

    constructor(poolClient: PoolClient, dataSource: DataSource) {
        super()
        this.poolClient = poolClient
        this.dataSource = dataSource
    }

    query<R>(
        query: string | SQLStatement,
        variables?: Array<unknown>
    ): Promise<QueryResult<R>> {
        if (this.poolClient === null) {
            throw new Error(
                `Unable to perform query as the client has already been released`
            )
        }

        return this.poolClient.query<R>(query, variables)
    }

    async release(): Promise<void> {
        if (this.poolClient !== null) {
            this.dataSource.deregisterClient(this)
            this.poolClient.release()
            this.poolClient = null
        }
    }

    async on(
        event: string,
        callback: (query: string, variables: Array<unknown>) => unknown
    ): Promise<void> {
        return
    }
}

export default PostgresClient
