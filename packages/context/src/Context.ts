import { DataSource } from '@entity-core/datasource'

class Context {
    dataSource: DataSource

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource
    }
}

export default Context