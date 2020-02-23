import { Context } from "@entity-core/context"
import { Model, EntityType } from "@entity-core/model"

class PostgresModel extends Model {
    async createEntity(context: Context, entity: EntityType): Promise<EntityType> {
        if (context !== null && entity !== null) {
            console.log('test')
        }

        return {
            type: 'Entity',
            title: 'test'
        }
    }
}

export default PostgresModel