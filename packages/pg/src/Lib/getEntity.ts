import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityType } from "@entity-core/model"
import { EntityQuery } from "../Types"
import PostgresDataSource from "../PostgresDataSource"

async function getEntity({ context, id, type }: { context: Context; id: string; type: string }): Promise<EntityType | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + 'entity';

    const tenantID = context.getTenantID()

    const query = sql`
        SELECT * FROM "`.append(table).append(sql`"
        WHERE tenant_id = ${tenantID}
          AND entity_type = ${type}
          AND id = ${id}
        LIMIT 1
    `)

    const { rows: [row = null] } = await client.query(query) as EntityQuery

    if (row === null) {
        return null
    }

    return {
        id: row.id.toString(),
        type: row.entity_type,
        uuid: row.uuid,
        props: row.props
    }
}

export default getEntity