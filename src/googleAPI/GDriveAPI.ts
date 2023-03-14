import { google } from "googleapis";
import fs from "fs";
import readline from "readline";
import { stringify } from "querystring";

class GDriveAPI {
  private drive: any;
  constructor() {}

  public async initialize() {
    const TOKEN_PATH = "src/googleAPI/token.json";
    const SCOPES = ["https://www.googleapis.com/auth/drive"];

    const content = await fs.promises.readFile(
      `src/googleAPI/credentials.json`
    );

    const { client_secret, client_id, redirect_uris } = JSON.parse(
      content.toString()
    );
    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    try {
      const token = await fs.promises.readFile(TOKEN_PATH);
      auth.setCredentials(JSON.parse(token.toString()));
    } catch {
      const authUrl = auth.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
      });
      console.log("Authorize this app by visiting this url:", authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question("Enter the code from that page here: ", async (code) => {
        try {
          const { tokens } = await auth.getToken(code);
          auth.setCredentials(tokens);
          await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
          rl.close();
        } catch (err) {
          console.error("Error retrieving access token", err);
        }
      });
    }
    this.drive = google.drive({ version: "v3", auth });
  }

  public async getFolderByName(folderName: string) {
    const filter = {
      fields: "files(id)",
      q: `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}'`,
    };
    try {
      const res = await this.drive.files.list(filter);
      return res.data;
    } catch (error) {
      throw error;
    }
  }

  public async getFileByName(filename: string) {
    const filter = {
      fields: "files(id,name)",
      q: `mimeType != 'application/vnd.google-apps.folder' and fullText contains '${filename}'`,
    };
    try {
      const res = await this.drive.files.list(filter);
      // @ts-ignore
      return res.data.files.filter(f=>f.name.includes(filename));
      
    } catch (error) {
      throw error;
    }
  }

  public async getFileById(fileId: string) {
    try {
      const res = await this.drive.files.get({
        fileId,
        fields: "kind,id,name",
      });
      return res.data;
    } catch (error) {
      throw error;
    }
  }

  public async createFileInParent(
    name: string,
    parentId: string,
    mimeType: string,
    filepath: string | null = null
  ) {
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
      const res = await this.drive.files.create(filter);
      return res.data;
    } catch (error) {
      throw error;
    }
  }

  public async deleteFileById(fileId: string) {
    try {
      const res = await this.drive.files.delete({ fileId });
      return res.data;
    } catch (error) {
      throw error;
    }
  }

  public async downloadFileById(fileId: string, path: string) {
    const dest = fs.createWriteStream(path);
    const res = await this.drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );
    return new Promise((resolve, reject) => {
      res.data
        .on("end", () => {
          resolve(1);
        })
        .on("error", (err: any) => {
          reject(err);
        })
        .pipe(dest);
    });
  }
}

export default new GDriveAPI();
