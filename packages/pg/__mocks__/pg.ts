const __poolClient = {
    query: jest.fn(),
    release: jest.fn(),
}

const __pool = {
    connect: jest.fn(() => {
        return __poolClient
    }),
    end: jest.fn(),
}

const __client = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
}

const Client = jest.fn(() => __client)
const Pool = jest.fn(() => __pool)
const PoolClient = jest.fn(() => __poolClient)

export { Client, Pool, PoolClient, __poolClient, __pool, __client }
