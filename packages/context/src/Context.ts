import { DataSource } from '@entity-core/datasource'
import { nanoid } from '@entity-core/uuid'

class Context {
    dataSource: DataSource
    tenantID: number
    uuidGenerator: () => string

    constructor({
        dataSource,
        tenantID = 1,
        uuidGenerator = nanoid
    }: {
        dataSource: DataSource;
        tenantID?: number;
        uuidGenerator?: () => string;
    }) {
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
}

export default Context