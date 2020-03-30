import { Context } from "@entity-core/context"
import { Model, EntityType } from "@entity-core/model"
import * as Lib from './Lib'

class PostgresModel extends Model {
    createEntity(context: Context, entity: EntityType): Promise<EntityType> {
        return Lib.createEntity({ context, entity })
    }
}

export default PostgresModel