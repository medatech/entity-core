import { Pool, PoolConfig } from 'pg'
import { DataSource, Client } from "@entity-core/datasource"
import PostgresClient from "./PostgresClient"

class PostgresDataSource extends DataSource {
    private poolConfig: PoolConfig
    private pool: Pool
    public tablePrefix: string
    private clients: Array<Client>

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
        this.pool = null
        this.poolConfig = poolConfig
        this.tablePrefix = tablePrefix
        this.clients = []
    }

    async connect(): Promise<void> {
        this.pool = new Pool(this.poolConfig)
    }

    async disconnect(): Promise<void> {
        // End all the clients
        await Promise.all(this.clients.map(c => c.release()));
        if (this.pool !== null) {
            await this.pool.end()
            this.pool = null;
        }
    }

    async getClient(): Promise<PostgresClient> {
        if (this.pool === null) {
            await this.connect()
        }

        const poolClient = await this.pool.connect();
        const client = new PostgresClient(poolClient, this);
        this.registerClient(client);
        return client;
    }

    public registerClient(client: Client): void {
        this.clients.push(client);
    }

    public deregisterClient(client: Client): void {
        this.clients = this.clients.filter(c => c !== client);
    }
}

export default PostgresDataSource