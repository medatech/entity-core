import QueryResult from './QueryResult'

abstract class Client {
    abstract async query(query: string, variables: Array<unknown>): Promise<QueryResult>

    abstract async release(): Promise<void>
}

export default Client