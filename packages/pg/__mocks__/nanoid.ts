let currentUuid = 1

const nanoid = jest.fn(() => `uuid:` + currentUuid++)
const __resetNanoid = jest.fn(() => (currentUuid = 1))

export { nanoid, __resetNanoid }
