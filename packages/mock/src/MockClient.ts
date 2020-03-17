
import { Client } from "@entity-core/datasource"

class MockClient extends Client {
    queryCallback: (query: string, variables?: Array<unknown>) => unknown

    async query(query: string, variables?: Array<unknown>): Promise<unknown> {
        return this.queryCallback(query, variables)
    }

    async release(): Promise<void> { return }

    async on(event: string, callback: (query: string, variables: Array<unknown>) => unknown): Promise<void> {
        if (event === 'query') {
            this.queryCallback = callback
        } else {
            throw new Error(`Unknown event ${event}`)
        }
    }
}

export default MockClient