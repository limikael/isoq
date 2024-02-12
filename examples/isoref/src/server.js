import isoqMiddleware from "__ISOQ_MIDDLEWARE";
import {Hono} from 'hono';
import {serve} from '@hono/node-server';
import {serveStatic} from '@hono/node-server/serve-static';

const app=new Hono();
app.use('*',serveStatic({root: './public'}))
app.get("*",c=>isoqMiddleware(c.req.raw,{localFetch: app.fetch}));

serve(app,(info)=>{
    console.log(`Listening on http://localhost:${info.port}`)
})