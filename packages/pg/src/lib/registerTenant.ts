import sql from "sql-template-strings"
import { Context, TenantID } from "@entity-core/context"
import PostgresDataSource from "../PostgresDataSource"
import PostgresClient from "../PostgresClient"

async function registerTenant({
    context,
}: {
    context: Context
}): Promise<string> {
    const dataSource = context.dataSource as PostgresDataSource
    const table = dataSource.tablePrefix + `tenant`
    const client = (await context.getDB()) as PostgresClient

    const query = sql`
        INSERT INTO "`.append(table).append(sql`" DEFAULT VALUES RETURNING id
    `)

    const result = await client.query<{ id: TenantID }>(query)
    if (result.rows.length !== 1) {
        throw new Error(
            `Unable to register tenant, expected 1 result but received ${result.rows.length}`
        )
    }

    const record = result.rows[0]

    return record.id
}

export default registerTenant
