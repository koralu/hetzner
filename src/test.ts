import fetch from "cross-fetch";

import * as dotenv from "dotenv";
dotenv.config();

(async () => {
  const resp = await fetch(
    "https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=-180&req=%7B%22time%22:%222021-10-18+2022-10-18%22,%22resolution%22:%22WEEK%22,%22locale%22:%22en-US%22,%22comparisonItem%22:%5B%7B%22geo%22:%7B%22country%22:%22US%22%7D,%22complexKeywordsRestriction%22:%7B%22keyword%22:%5B%7B%22type%22:%22BROAD%22,%22value%22:%22sunflower%22%7D%5D%7D%7D%5D,%22requestOptions%22:%7B%22property%22:%22%22,%22backend%22:%22IZG%22,%22category%22:0%7D,%22userConfig%22:%7B%22userType%22:%22USER_TYPE_LEGIT_USER%22%7D%7D&token=APP6_UEAAAAAY0_X1KoNy-NkCRgv1et6gkYmQd022YCv&tz=-180",
    {
      credentials: "include",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:105.0) Gecko/20100101 Firefox/105.0",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.5",
        "Alt-Used": "trends.google.com",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
      },
      referrer: "https://trends.google.com/trends/explore?geo=US&q=sunflower",
      method: "GET",
      mode: "cors",
    }
  );

  console.log(resp);
  // const result = await resp.json();
})();
