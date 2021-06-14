import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityID, EntityType, EntityParent } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

async function getParents({
    context,
    id,
    type,
    limit = 100,
    tenantID = null,
}: {
    context: Context
    id: EntityID
    type: EntityType
    limit?: number
    tenantID?: number
}): Promise<EntityParent[]> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === null) {
        tenantID = context.getTenantID()
    }

    // Create a recursive query which will take an entity, then return it's parent/type fields.
    // Do this recurisively and ignore the last node which wont have any parent/type fields set
    const query = sql`
        WITH RECURSIVE search_parents(tenant_id, id, entity_type, parent, parent_type, depth) AS (
            SELECT e.tenant_id, e.id, e.entity_type, e.parent, e.parent_type, 1 as depth
            FROM "`
        .append(table)
        .append(
            sql`" e
            UNION ALL
                SELECT e.tenant_id, e.id, e.entity_type, sp.parent, sp.parent_type, sp.depth + 1
                FROM "`.append(table).append(sql`" e, search_parents sp
                WHERE e.tenant_id = sp.tenant_id AND e.parent = sp.id AND e.parent_type = sp.entity_type
        )
        SELECT parent, parent_type from search_parents
        WHERE tenant_id = ${tenantID} AND id = ${id} AND entity_type = ${type}
        AND parent is not null -- Exclude the root node as we'll get the details from the immediate child
        LIMIT ${limit};
    `)
        )

    const { rows } = await client.query<{
        parent: EntityID
        parent_type: EntityType
    }>(query)

    return rows.map((row) => ({
        id: row.parent,
        type: row.parent_type,
    }))
}

export default getParents
