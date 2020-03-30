abstract class Client {
    abstract async query(query: string, variables?: Array<unknown>): Promise<unknown>

    abstract async release(): Promise<void>

    abstract async on(event: string, callback: (query: string, variables: Array<unknown>) => unknown): Promise<void>
}

export default Client