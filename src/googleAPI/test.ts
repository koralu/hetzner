import GDriveAPI from "./GDriveAPI";

(async()=>{
   await GDriveAPI.initialize();
   let t = await GDriveAPI.getFileByName(
      `[US][Amazon.com][Daily][2022-07-07]`
    );
    if (t[0]) {
    console.log(t[0].id)
    }
})()