import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityQuery } from "../Types"
import PostgresDataSource from "../PostgresDataSource"

async function getEntity<O>({
    context,
    id,
    type,
    _lock = false,
}: {
    context: Context
    id: string
    type: string
    _lock?: boolean
}): Promise<O | null> {
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

    const {
        rows: [row = null],
    } = (await client.query(query)) as EntityQuery

    if (row === null) {
        return null
    }

    const entity = {
        id: row.id.toString(),
        type: row.entity_type,
        uuid: row.uuid,
        props: row.props,
    }

    return (<unknown>entity) as O
}

export default getEntity