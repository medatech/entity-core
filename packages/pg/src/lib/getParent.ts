import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityID, EntityType, Entity, EntityRecord } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"

async function getParent<E extends Entity>({
    context,
    id,
    type,
}: {
    context: Context
    id: EntityID
    type: EntityType
}): Promise<E | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`

    const tenantID = context.getTenantID()

    const query = sql`
        SELECT p.*
        FROM "`
        .append(table)
        .append(
            sql`" p, "`.append(table).append(sql`" c
        WHERE p.id = c.parent
        AND p.tenant_id = ${tenantID}
        AND c.tenant_id = ${tenantID}
        AND c.entity_type = ${type}
        AND c.id = ${id}
        LIMIT 1
        `)
        )

    const { rows } = await client.query<EntityRecord>(query)

    if (rows.length > 0) {
        return {
            id: rows[0].id,
            type: rows[0].entity_type,
            uuid: rows[0].uuid,
            props: rows[0].props,
        } as E
    } else {
        return null
    }
}

export default getParent
