
import { Client } from "@entity-core/datasource"

class MockClient extends Client {
    queryCallback: (query: string, variables?: Array<unknown>) => unknown

    onQuery(
        fn: (query: string, variables?: Array<unknown>) => unknown
    ): void {
        this.queryCallback = fn
    }

    async query(query: string, variables?: Array<unknown>): Promise<unknown> {
        return this.queryCallback(query, variables)
    }

    async release(): Promise<void> { return }
}

export default MockClient