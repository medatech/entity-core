import { Pool, PoolConfig } from 'pg'
import { DataSource } from "@entity-core/datasource"
import PostgresClient from "./PostgresClient"

class PostgresDataSource extends DataSource {
    poolConfig: PoolConfig
    pool: Pool
    tablePrefix: string

    constructor({
        poolConfig,
        tablePrefix = ''
    }:
        {
            poolConfig: PoolConfig;
            tablePrefix?: string;
        }
    ) {
        super()
        this.poolConfig = poolConfig
        this.tablePrefix = tablePrefix
    }

    async connect(): Promise<void> {
        this.pool = new Pool(this.poolConfig)
    }

    disconnect(): Promise<void> {
        return this.pool.end()
    }

    async getClient(): Promise<PostgresClient> {
        const poolClient = await this.pool.connect()
        return new PostgresClient(poolClient)
    }
}

export default PostgresDataSource