import {readPackageUp} from 'read-package-up';

export async function getPackageVersion(cwd) {
    let pkgInfo=await readPackageUp({cwd});
    return pkgInfo.packageJson.version;
}
