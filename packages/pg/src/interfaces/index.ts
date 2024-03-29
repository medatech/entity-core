import { TenantID } from "@entity-core/context"

export type EntityID = string
export type EntityType = string
export type EntityUuid = string
export type EntityProps = Record<string, unknown> | null
export type EntityRelationship = string

export interface Entity {
    id?: EntityID
    uuid?: EntityUuid
    type: EntityType
    props: EntityProps
    tenantID?: TenantID
}

export interface EntityRecord {
    id: EntityID
    tenant_id: TenantID
    entity_type: EntityType
    uuid: EntityUuid
    props: EntityProps
    parent?: EntityID | null
    parent_type?: EntityType | null
    previous?: EntityID | null
}

export interface EntityPlacement {
    type: "firstChild" | "lastChild" | "before" | "after"
    entityID: EntityID
    entityType: EntityType
}

export interface EntitySibling {
    id: EntityID
    type: EntityType
}

export interface EntityParent {
    id: EntityID
    type: EntityType
}

export interface EntitySiblings {
    parentID: EntityID
    parentType: EntityType
    previousSiblingID: EntityID | null
    nextSiblingID: EntityID | null
}

export type FilterProps = Record<string, string | number | null | boolean>
