import Client from './Client'

abstract class DataSource {
    abstract async connect(): Promise<void>

    abstract async disconnect(): Promise<void>

    abstract async getClient(): Promise<Client>
}

export default DataSource