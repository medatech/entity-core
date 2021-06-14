import { DataSource, Client } from "@entity-core/datasource"
import { nanoid } from "@entity-core/uuid"
import { TenantID } from "./types"

class Context {
    dataSource: DataSource
    dbClient: Client
    tenantID: TenantID
    uuidGenerator: () => string
    constructor({
        dataSource,
        tenantID = `1`,
        uuidGenerator = nanoid,
    }: {
        dbClient?: Client
        dataSource: DataSource
        tenantID?: TenantID
        uuidGenerator?: () => string
    }) {
        this.dbClient = null
        this.dataSource = dataSource
        this.tenantID = tenantID
        this.uuidGenerator = uuidGenerator
    }

    getTenantID() {
        return this.tenantID
    }

    setTenantID(tenantID: string): void {
        this.tenantID = tenantID
    }

    uuid() {
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
