export default interface Placement {
    type: "child" | "before" | "after"
    entityID: string
    entityType: string
}
