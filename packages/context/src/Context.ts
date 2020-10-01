import { DataSource, Client } from "@entity-core/datasource"
import { nanoid } from "@entity-core/uuid"

class Context<T> {
    dataSource: DataSource
    dbClient: Client
    tenantID: number
    uuidGenerator: () => string
    model: T

    constructor({
        dataSource,
        tenantID = 1,
        uuidGenerator = nanoid,
        model,
    }: {
        dataSource: DataSource
        tenantID?: number
        uuidGenerator?: () => string
        model: T
    }) {
        this.dbClient = null
        this.dataSource = dataSource
        this.tenantID = tenantID
        this.uuidGenerator = uuidGenerator
        this.model = model
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

    getModel(): T {
        return this.model
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
