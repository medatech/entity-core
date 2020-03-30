import sql from "sql-template-strings"
import { Context } from "@entity-core/context"
import { EntityType } from "@entity-core/model"
import { EntityQuery } from "../Types"
import PostgresDataSource from "../PostgresDataSource"

async function getChildren({
    context,
    parentID,
    parentType = null,
    childType = null,
    fromID = null,
    limit = 10,
}: {
    context: Context;
    parentID: string;
    parentType: string;
    childType: string;
    fromID?: string;
    limit?: number;
}): Promise<Array<EntityType>> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + 'entity';
    const tenantID = context.getTenantID()

    const query = sql`
        WITH RECURSIVE ent AS (
            -- Get our first element
            SELECT *, 1 as index
            FROM "`.append(table).append(sql`"
            WHERE tenant_id = ${tenantID}
                AND entity_type = ${childType}
                AND parent = ${parentID}
                AND parent_type = ${parentType}
            `)
    if (fromID === null) {
        query.append(sql`AND previous IS NULL`)
    } else {
        query.append(sql`AND previous = ${fromID}`)
    }
    query.append(sql`
        UNION
            SELECT
                e.*, ent.index + 1 as index
            FROM
                "`.append(table).append(sql`" e
            INNER JOIN ent ON (
                    ent.tenant_id = e.tenant_id
                AND ent.entity_type = e.entity_type
                AND ent.id = e.previous
                AND ent.parent = e.parent
                AND ent.parent_type = e.parent_type
                AND ent.index < ${limit}
            )
    )
    SELECT * FROM ent 
    ORDER BY ent.index
    LIMIT ${limit}
    `))

    const { rows } = await client.query(query) as EntityQuery

    return rows.map(row => ({
        id: row.id.toString(),
        type: row.entity_type,
        uuid: row.uuid,
        props: row.props
    }))
}

export default getChildren