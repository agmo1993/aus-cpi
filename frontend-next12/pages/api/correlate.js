const calculateCorrelation = require("calculate-correlation");

export default async function handler(req, res) {
  if (req.method === "POST") {
    const postData = req.body;
    // do something with the post data

    const arrays = postData.map((x) => ({
      item: x[0].item,
      values: x.map((y) => parseFloat(y.cpi_value)),
    }));
    const categories = postData.map((x) => x[0].item);

    const n = arrays.length;

    const correlationData = [];

    for (let i = 0; i < n; i++) {
      let value1 = arrays[i];
      for (let j = 0; j < n; j++) {
        let value2 = arrays[j];
        if (
          correlationData.filter(
            (x) => x.itemY === value2.item && x.itemX === value1.item
          ).length === 0
        ) {
          correlationData.push({
            itemY: value1.item,
            itemX: value2.item,
            corr: calculateCorrelation(value1.values, value2.values),
          });
        }
      }
    }

    // console.log(correlationData);

    res.status(200).json({ data: correlationData, categories: categories });
  } else {
    res.status(400).json({ message: "Invalid request method." });
  }
}
