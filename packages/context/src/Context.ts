import { DataSource, Client } from "@entity-core/datasource"
import { nanoid } from "@entity-core/uuid"

class Context {
    dataSource: DataSource
    dbClient: Client
    tenantID: number
    uuidGenerator: () => string

    constructor({
        dataSource,
        tenantID = 1,
        uuidGenerator = nanoid,
    }: {
        dataSource: DataSource
        tenantID?: number
        uuidGenerator?: () => string
    }) {
        this.dbClient = null
        this.dataSource = dataSource
        this.tenantID = tenantID
        this.uuidGenerator = uuidGenerator
    }

    getTenantID(): number {
        return this.tenantID
    }

    setTenantID(tenantID: number): void {
        this.tenantID = tenantID
    }

    uuid(): string {
        return this.uuidGenerator()
    }

    async getDB(): Promise<Client> {
        if (this.dbClient === null) {
            this.dbClient = await this.dataSource.getClient()
        }
        return this.dbClient
    }

    async end(): Promise<void> {
        if (this.dbClient !== null) {
            this.dbClient.release()
        }
    }
}

export default Context
