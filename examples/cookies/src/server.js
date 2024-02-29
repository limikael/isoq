import isoqRequestHandler from "../.target/isoq-request-handler.js";
import {Hono} from 'hono';
import {serve} from '@hono/node-server';

const app=new Hono();
app.get("*",c=>isoqRequestHandler(c.req.raw,{localFetch: app.fetch}));

serve(app,(info)=>{
    console.log(`Listening on http://localhost:${info.port}`)
})