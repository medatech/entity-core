interface EntityRecord {
    id: number;
    entity_type: string;
    uuid: string;
    props: object | null;
    parent?: number | null;
    parent_type?: string | null;
    previous?: number | null;
}

export default EntityRecord