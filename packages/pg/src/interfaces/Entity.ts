export default interface Entity {
    id?: number
    uuid?: string
    type: string
    props: Record<string, unknown>
}
