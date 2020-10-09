import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { Entity, EntityRecord } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"

async function getEntities<E extends Entity>({
    context,
    entities,
    limit = null,
}: {
    context: Context
    entities: { id: string; type: string }[]
    limit?: number | null
}): Promise<E[]> {
    if (entities.length === 0) {
        return []
    }

    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`

    const tenantID = context.getTenantID()

    const query = sql`
        -- Select all the fields from the entity table
        SELECT e.*
        FROM "`.append(table).append(sql`" e
        -- Now join it with our arbitary list of id+type key plus the order we want them in
        INNER JOIN
        UNNEST(
            ${entities.map((e) => e.id)}::int[],
            ${entities.map((e) => e.type)}::text[],
            ${entities.map((e, i) => i)}::int[]
        ) AS list (id, entity_type, sortIndex)
        -- Join them on the entity id and entity type
        ON (
                e.id = list.id
            AND e.entity_type = list.entity_type 
        )
        WHERE e.tenant_id = ${tenantID}
        -- Now preserve our ordering by using the sortIndex values
        ORDER BY sortIndex
    `)

    if (limit !== null) {
        query.append(sql`LIMIT ${limit}`)
    }

    const { rows } = await client.query<EntityRecord>(query)

    return rows.map((row) => ({
        id: row.id,
        type: row.entity_type,
        uuid: row.uuid,
        props: row.props,
    })) as E[]
}

export default getEntities
