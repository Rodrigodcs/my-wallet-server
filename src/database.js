import pg from "pg"

const {Pool} = pg

const connection = new Pool({
    user: 'postgres',
    password: '123',
    host: 'localhost',
    port: 5432,
    database: 'mywallet'
})

export default connection;