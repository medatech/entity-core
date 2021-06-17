import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import { Entity, EntityRecord } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

async function getEntities<E extends Entity>({
    context,
    entities,
    limit = null,
    tenantID,
}: {
    context: Context
    entities: { id: string; type: string }[]
    limit?: number | null
    tenantID?: TenantID | null
}): Promise<E[]> {
    if (entities.length === 0) {
        return []
    }

    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

    const query = sql`
        -- Select all the fields from the entity table
        SELECT e.*
        FROM "`
        .append(table)
        .append(
            sql`" e
        -- Now join it with our arbitrary list of id+type key plus the order we want them in
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
        `
        )
        .append(
            tenantID !== null ? sql`WHERE e.tenant_id = ${tenantID}` : sql``
        ).append(sql`
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
        tenantID: row.tenant_id,
    })) as E[]
}

export default getEntities
