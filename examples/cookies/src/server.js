import isoqMiddleware from "__ISOQ_MIDDLEWARE";
import {Hono} from 'hono';
import {serve} from '@hono/node-server';

const app=new Hono();
app.use("*",isoqMiddleware({localFetch: app.fetch}));

serve(app,(info)=>{
    console.log(`Listening on http://localhost:${info.port}`)
})