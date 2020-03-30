import Client from './Client'

abstract class DataSource {
    abstract async connect(): Promise<void>

    abstract async disconnect(): Promise<void>

    abstract async getClient(): Promise<Client>

    abstract registerClient(client: Client): void

    abstract deregisterClient(client: Client): void
}

export default DataSource