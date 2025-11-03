import 'dotenv/config';
export default{
    schema :'./src/models/*.js',
    out:'./drizzle',
    dialect:'postgresql',
    url:process.env.DATABASE_URL,    
}