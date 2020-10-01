interface EntityRecord {
    id: number
    entity_type: string
    uuid: string
    props: Record<string, unknown> | null
    parent?: number | null
    parent_type?: string | null
    previous?: number | null
}

export default EntityRecord
