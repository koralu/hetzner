import { google } from "googleapis";
import fs from "fs";
import inquirer from "inquirer";

const TOKEN_PATH = "src/googleAPI/token.json";
const SCOPES = ["https://www.googleapis.com/auth/drive"];

const content = await fs.promises.readFile("src/googleAPI/credentials.json");
const { client_secret, client_id, redirect_uris } = JSON.parse(content);
const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

try {
  const token = await fs.promises.readFile(TOKEN_PATH);
  auth.setCredentials(JSON.parse(token));
} catch {
  const authUrl = auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const resp = await inquirer.prompt({
    type: "input",
    name: "code",
    message: "Enter the code from that page here: ",
  });

  try {
    const { tokens } = await auth.getToken(resp.code);
    auth.setCredentials(tokens);
    await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  } catch (err) {
    console.error("Error retrieving access token", err);
  }
}

const drive = google.drive({ version: "v3", auth });

export default drive;
