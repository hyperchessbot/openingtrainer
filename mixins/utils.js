export function simpleFetch(url, params, callback) {
  params.headers = params.headers || {};
  if (params.asForm)
    params.headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (params.asJson) params.headers.Accept = "application/json";
  if (params.asVndLichessV3Json) {
    params.headers.Accept = "application/vnd.lichess.v3+json";
    params.asJson = true;
  }
  if (params.asNdjson) params.headers.Accept = "application/x-ndjson";
  if (params.accessToken)
    params.headers.Authorization = "Bearer " + params.accessToken;
  if (params.server)
    api(
      "request:fetch",
      {
        url: url,
        params: params
      },
      (result) => callback(result)
    );
  else
    fetch(url, params).then(
      (response) =>
        response.text().then(
          (text) => {
            if (params.asJson || params.asNdjson) {
              try {
                let obj;
                if (params.asNdjson) {
                  obj = text
                    .split("\n")
                    .filter((line) => line.length)
                    .map((line) => JSON.parse(line));
                } else {
                  obj = JSON.parse(text);
                }
                try {
                  callback({ ok: true, content: obj });
                } catch (err) {
                  console.log(err, obj);
                }
              } catch (err) {
                console.log("fetch parse json error", err);
                callback({ ok: false, status: "Error: Could not parse json." });
              }
            } else {
              callback({ ok: true, content: text });
            }
          },
          (err) => {
            console.log("fetch get response text error", err);
            callback({
              ok: false,
              status: "Error: Failed to get response text."
            });
          }
        ),
      (err) => {
        console.log("fetch error", err);
        callback({ ok: false, status: "Error: Failed to fetch." });
      }
    );
}
