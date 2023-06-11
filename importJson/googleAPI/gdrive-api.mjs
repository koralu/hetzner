import drive from "./drive.mjs";
import fs from "fs";
import colors from "colors/safe.js";
import path from "path";

export const downloadFileById = async (fileId, path) => {
  const dest = fs.createWriteStream(path);
  const res = await drive.files.get(
    { fileId, alt: "media" },
    { responseType: "stream" }
  );
  return new Promise((resolve, reject) => {
    res.data
      .on("end", () => {
        resolve();
      })
      .on("error", (err) => {
        reject(err);
      })
      .pipe(dest);
  });
};

export const getFileById = async (fileId, fields = "kind,id,name") => {
  try {
    const res = await drive.files.get({ fileId, fields });
    return res.data;
  } catch (error) {
    throw error;
  }
};
//if creating folder filepath is null
export const createFileInParent = async (
  name,
  parentId,
  mimeType,
  filepath = null
) => {
  const fileMetadata = {
    name,
    parents: [parentId],
    mimeType,
  };
  const media = filepath && { body: fs.createReadStream(filepath) };

  const filter = {
    resource: fileMetadata,
    fields: "id,size",
    media,
  };

  try {
    const res = await drive.files.create(filter);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getFolderByName = async (folderName) => {
  const filter = {
    fields: "files(id)",
    q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}'`,
  };
  try {
    const res = await drive.files.list(filter);
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFileById = async (fileId) => {
  try {
    const res = await drive.files.delete({ fileId });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const getFileByName = async (filename) => {
  const filter = {
    fields: "files(id,name)",
    q: `mimeType != 'application/vnd.google-apps.folder' and fullText contains '${filename}'`,
  };
  try {
    const res = await drive.files.list(filter);
    return res.data.files.filter((f) => f.name.includes(filename));
  } catch (error) {
    throw error;
  }
};

export const uploadFile = async (
  country,
  department,
  timeframe,
  filepath,
  reportSize
) => {
  console.log(colors.yellow("Uploading to GDrive..."));

  let uploadFolderId = null;

  let { files } = await getFolderByName(
    `[${country}][${department}][${timeframe}]`
  );
  if (files.length) {
    uploadFolderId = files[0].id;
  } else throw "FolderId to Upload Not Found";

  try {
    let { id, size } = await createFileInParent(
      path.basename(filepath),
      uploadFolderId,
      "text/json",
      filepath
    );
    if (Math.abs(size - reportSize) < 15700 && Number(reportSize) > 72581) {
      // fs.promises.unlink(filepath);
      console.log(colors.yellow(`${filepath} has been uploaded`));
    } else {
      console.log(size + " " + reportSize);
      console.log(Number(reportSize));
      //await deleteFileById(id);
      console.log(
        colors.red(`[ERR]Size not matched or the report is to small`)
      );
    }
  } catch (err) {
    console.log(colors.red("[CRITICAL]" + err));
  }
};
