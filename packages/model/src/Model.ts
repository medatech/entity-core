import { Context } from "@entity-core/context"
import EntityType from "./Types/EntityType"

abstract class Model {
    abstract async createEntity(context: Context, entity: EntityType): Promise<EntityType>
}

export default Model