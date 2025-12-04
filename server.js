// server.js
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://thingproxy.freeboard.io/fetch/",
    "https://proxy.cors.sh/"
];

function getProxyUrl(apiURL) {
    const randomProxy = PROXIES[Math.floor(Math.random() * PROXIES.length)];
    return randomProxy + encodeURIComponent(apiURL);
}

async function fetchWithRetry(url, attempt = 1) {
    try {
        const proxyURL = getProxyUrl(url);
        const res = await fetch(proxyURL);
        return await res.json();
    } catch (e) {
        if (attempt <= 3) {
            console.log(`Retry ${attempt} for ${url}`);
            return fetchWithRetry(url, attempt + 1);
        }
        return null;
    }
}

app.post("/bulk-check", async (req, res) => {
    const numbers = req.body.numbers || [];
    let results = [];

    // Process 5 requests in parallel at a time
    const concurrency = 5;
    for (let i = 0; i < numbers.length; i += concurrency) {
        const batch = numbers.slice(i, i + concurrency);
        const batchResults = await Promise.all(
            batch.map(async (num) => {
                const apiURL = `https://heybroo-upi.profilework239.workers.dev/?number=${num}`;
                const data = await fetchWithRetry(apiURL);
                const d = data?.data?.verify_vpa_resp;
                if (!d || !d.upi_number) return null;
                return {
                    Number: num,
                    Name: d.name || "",
                    UPI: d.upi_number || "",
                    IFSC: d.ifsc || ""
                };
            })
        );
        results = results.concat(batchResults.filter(r => r));
    }

    res.json({ results });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));