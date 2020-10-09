import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { Entity } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"

async function updateEntity({
    context,
    entity,
}: {
    context: Context
    entity: Entity
}): Promise<void> {
    if (entity.id === undefined || entity.type === undefined) {
        throw new Error(`entity must have an id and type`)
    }

    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`

    const tenantID = context.getTenantID()

    const query = sql`
        UPDATE "`.append(table).append(sql`"
          SET props = ${entity.props || null}
        WHERE tenant_id = ${tenantID}
          AND entity_type = ${entity.type}
          AND id = ${entity.id}
    `)

    await client.query(query)
}

export default updateEntity
