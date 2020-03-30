import sql from 'sql-template-strings'
import { Context } from "@entity-core/context"
import { EntityType } from "@entity-core/model"
import { EntityQuery } from "../Types"
import PostgresDataSource from "../PostgresDataSource"

async function createEntity(context: Context, entity: EntityType): Promise<EntityType | null> {
    const dataSource = context.dataSource as PostgresDataSource
    const client = await dataSource.getClient()
    const table = dataSource.tablePrefix + 'entity';

    const tenantID = context.getTenantID()
    const uuid = entity.uuid || context.uuid()

    const query = sql`
        INSERT INTO "`.append(table).append(sql`"
        (tenant_id, entity_type, uuid, props, parent, parent_type, previous)
        VALUES
        (${tenantID}, ${entity.type}, ${uuid}, ${entity.props || null}, null, null, null)
        RETURNING *
    `)

    const { rows: [row = null] } = await client.query(query) as EntityQuery

    if (row === null) {
        throw new Error(`No row returned from the database`)
    }

    return {
        _id: row.id.toString(),
        type: row.entity_type,
        uuid: row.uuid,
        props: row.props
    }
}

export default createEntity