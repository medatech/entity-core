import sql from 'sql-template-strings'
import { Context } from "@entity-core/context"
import { EntityType } from "@entity-core/model"
import { EntityQuery } from '../Types'

async function createEntity(context: Context, entity: EntityType): Promise<EntityType | null> {
    const client = await context.dataSource.getClient()

    const tenantID = context.getTenantID()
    const uuid = entity.uuid || context.uuid()

    const query = sql`
        INSERT INTO entity
        (tenant_id, entity_type, uuid, title, props, parent, parent_type, previous)
        VALUES
        (${tenantID}, ${entity.type}, ${uuid}, ${entity.title}, ${entity.props || null}, null, null, null)
        RETURNING *
    `

    const { rows: [row = null] } = await client.query(query.sql, query.values) as EntityQuery

    if (row === null) {
        throw new Error(`No row returned from the database`)
    }

    return {
        _id: row.id.toString(),
        type: row.entity_type,
        uuid: row.uuid,
        title: row.title,
        props: row.props
    }
}

export default createEntity