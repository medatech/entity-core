import PostgresDataSource from "../PostgresDataSource";

const dataSource = new PostgresDataSource({
    poolConfig: {
        database: 'entitycore',
        user: 'entitycore',
        password: 'entitycore',
        host: 'localhost'
    },
    tablePrefix: 'ec_'
});

export default dataSource