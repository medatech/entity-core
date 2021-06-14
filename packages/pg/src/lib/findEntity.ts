import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { Entity, EntityRecord, EntityType } from "../interfaces"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

async function findEntity<E extends Entity>({
    context,
    props,
    type,
    tenantID = null,
}: {
    context: Context
    props: Record<string, string | number | null | boolean>
    type: EntityType
    tenantID?: number
}): Promise<E | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = (await context.getDB()) as PostgresClient
    const table = dataSource.tablePrefix + `entity`

    if (tenantID === null) {
        tenantID = context.getTenantID()
    }

    let query = sql`
        SELECT * FROM "`.append(table).append(sql`"
        WHERE tenant_id = ${tenantID}
          AND entity_type = ${type} `)

    // Now append the entity props to filter on
    Object.keys(props).forEach((field) => {
        const value = props[field]
        if (value === null) {
            query = query.append(`AND props->>'${field}' is null `)
        } else {
            query = query
                .append(`AND props->>'${field}' = `)
                .append(sql`${value} `)
        }
    })

    query = query.append(sql`
        LIMIT 1
    `)

    const {
        rows: [row = null],
    } = await client.query<EntityRecord>(query)

    if (row === null) {
        return null
    }

    return {
        id: row.id,
        type: row.entity_type,
        uuid: row.uuid,
        props: row.props,
    } as E
}

export default findEntity
