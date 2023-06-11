//Trebuie sters token.json inainte de refresh
import {getFolderByName} from './gdrive-api.mjs'

let {files} = await getFolderByName('[US]')

console.log(files)
