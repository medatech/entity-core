import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityID, EntityType, Entity, EntityRecord } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"

async function getEntity<E extends Entity>({
    context,
    id,
    type,
    _lock = false,
}: {
    context: Context
    id: EntityID
    type: EntityType
    _lock?: boolean
}): Promise<E | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`

    const tenantID = context.getTenantID()

    const query = sql`
        SELECT * FROM "`.append(table).append(sql`"
        WHERE tenant_id = ${tenantID}
          AND entity_type = ${type}
          AND id = ${id}
        LIMIT 1
    `)

    if (_lock) {
        query.append(`FOR UPDATE`)
    }

    const result = await client.query<EntityRecord>(query)
    if (result.rows.length === 0) {
        return null
    }
    const record = result.rows[0]

    const outputEntity = {
        id: record.id,
        type: record.entity_type,
        uuid: record.uuid,
        props: record.props,
    } as E

    return outputEntity
}

export default getEntity
