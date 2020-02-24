abstract class Client {
    abstract async query(query: string, variables: Array<unknown>): Promise<unknown>

    abstract async release(): Promise<void>
}

export default Client