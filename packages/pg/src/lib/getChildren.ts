import sql, { SQLStatement } from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import {
    EntityID,
    EntityType,
    Entity,
    EntityRecord,
    FilterProps,
} from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

function createFilterStatement(
    isFirstCondition = true,
    filter: FilterProps,
    fieldPrefix = ``
) {
    let query: SQLStatement | null = null
    // Now append the entity props to filter on
    Object.keys(filter).forEach((field, index) => {
        if (query === null) {
            query = isFirstCondition ? sql`` : sql` AND `
        }

        const value = filter[field]
        if (index !== 0 || isFirstCondition === false) {
            query.append(` AND `)
        }
        if (value === null) {
            query = query
                .append(fieldPrefix)
                .append(`props->>'${field}' is null `)
        } else {
            query = query
                .append(fieldPrefix)
                .append(`props->>'${field}' = `)
                .append(sql`${value} `)
        }
    })

    return query
}

async function getChildren<E extends Entity>({
    context,
    parentID,
    parentType = null,
    childType = null,
    filter = {},
    fromID = null,
    limit = 10,
    tenantID,
}: {
    context: Context
    parentID: EntityID
    parentType: EntityType
    childType: EntityType
    filter?: FilterProps
    fromID?: EntityID | null
    limit?: number
    tenantID?: TenantID | null
}): Promise<E[]> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === undefined) {
        tenantID = context.getTenantID()
    }

    const filterStatement = createFilterStatement(true, filter, ``)

    const query = sql`
        WITH RECURSIVE ent AS (
            -- Get our first element
            SELECT *, 1 as index
            FROM "`
        .append(table)
        .append(
            sql`"
            WHERE entity_type = ${childType}
                AND parent = ${parentID}
                AND parent_type = ${parentType}
                `
        )
        .append(tenantID !== null ? sql`AND tenant_id = ${tenantID} ` : sql``)

    if (fromID === null) {
        query.append(sql`AND previous IS NULL `)
    } else {
        query.append(sql`AND previous = ${fromID} `)
    }
    query.append(
        sql`
        UNION
            SELECT
                e.*, ent.index + 1 as index
            FROM
                "`
            .append(table)
            .append(
                sql`" e
            INNER JOIN ent ON (
                    ent.entity_type = e.entity_type
                AND ent.id = e.previous
                AND ent.parent = e.parent
                AND ent.parent_type = e.parent_type
                AND ent.index < ${limit}
                `
            )
            .append(
                tenantID !== null
                    ? sql`AND ent.tenant_id = e.tenant_id `
                    : sql``
            )
            .append(
                sql`
            )
    )
    SELECT * FROM ent`
            )
            .append(
                filterStatement === null
                    ? ``
                    : sql` WHERE `.append(filterStatement)
            ).append(`
    ORDER BY ent.index
    LIMIT ${limit}
    `)
    )

    const { rows } = await client.query<EntityRecord>(query)

    return rows.map((row) => ({
        id: row.id,
        type: row.entity_type,
        uuid: row.uuid,
        props: row.props,
        tenantID: row.tenant_id,
    })) as E[]
}

export default getChildren
