import { MockClient, MockDataSource } from "@entity-core/mock"
import { DataSource } from "@entity-core/datasource";
import PostgresDataSource from "../PostgresDataSource";

const TEST_ENV = process.env.TEST_ENV

let dataSource: DataSource = null

if (TEST_ENV === 'unit') {
    dataSource = new MockDataSource(new MockClient())
} else {
    dataSource = new PostgresDataSource({
        poolConfig: {
            database: 'entitycore',
            user: 'entitycore',
            password: 'entitycore',
            host: 'localhost'
        },
        tablePrefix: 'ec_'
    });
}

export default dataSource