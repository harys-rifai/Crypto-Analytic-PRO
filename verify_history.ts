
async function check(hours: number) {
    const res = await fetch(`http://localhost:5000/api/cryptocurrencies/bitcoin/history?hours=${hours}`);
    const data = await res.json();
    if (!Array.isArray(data)) {
        console.log(`Hours ${hours}: Not an array`, data);
        return;
    }
    const len = data.length;
    if (len === 0) {
        console.log(`Hours ${hours}: Count = 0`);
        return;
    }
    const timestamps = data.map(d => new Date(d.timestamp).getTime());
    const min = Math.min(...timestamps);
    const max = Math.max(...timestamps);
    const durationHrs = (max - min) / (1000 * 60 * 60);
    console.log(`Hours ${hours}: Count = ${len}, Duration = ${durationHrs.toFixed(2)}h`);
}

(async () => {
    await check(1);
    await check(3);
    await check(6);
    await check(24);
    await check(72);
})();
