import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityType, EntityQuery } from "../Types"
import PostgresDataSource from "../PostgresDataSource"

async function findEntity<T>({
    context,
    props,
    type,
}: {
    context: Context
    props: Record<string, string | number | null | boolean>
    type: string
}): Promise<T | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + `entity`

    const tenantID = context.getTenantID()

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
    } = (await client.query(query)) as EntityQuery

    if (row === null) {
        return null
    }

    return (<unknown>{
        id: row.id.toString(),
        type: row.entity_type,
        uuid: row.uuid,
        props: row.props,
    }) as T
}

export default findEntity
