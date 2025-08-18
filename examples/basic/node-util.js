import mime from 'mime/lite';
import path from "node:path";
import fs, {promises as fsp} from "node:fs";

export async function createStaticResponse({request, cwd}) {
    let url=new URL(request.url);
    let assetAbs=path.join(cwd,url.pathname);
    if (fs.existsSync(assetAbs) &&
            fs.statSync(assetAbs).isFile()) {
        console.log("serving static: "+assetAbs);

        let stat=fs.statSync(assetAbs);        

        let headers=new Headers();
        headers.set("content-type",mime.getType(assetAbs.slice(assetAbs.lastIndexOf(".")+1)));
        headers.set("content-length",stat.size);

        let body=createStreamBody(fs.createReadStream(assetAbs));

        return new Response(body,{headers});
    }
}

export function createStreamBody(stream) {
    const body = new ReadableStream({
        start(controller) {
            stream.on('data', (chunk) => {
                controller.enqueue(chunk)
            })
            stream.on('end', () => {
                controller.close()
            })
        },

        cancel() {
            stream.destroy()
        },
    })
    return body
}
