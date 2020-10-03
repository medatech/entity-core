import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityType } from "../Types"
import PostgresDataSource from "../PostgresDataSource"

async function updateEntity({
    context,
    entity,
}: {
    context: Context
    entity: EntityType
}): Promise<void> {
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
