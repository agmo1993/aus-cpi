"use client";
import { useState } from "react";
import HighChartsLine from "../highChartsLine";
import Input from "../ui/input";
import Button from "../ui/button";
import styles from "./chart.module.css";

export default function ChartWindow() {
  const [data, setData] = useState([
    { label: "A", value: 10 },
    { label: "B", value: 20 },
  ]);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");

  const addPoint = () => {
    if (!label || value === "") return;
    setData([...data, { label, value: parseFloat(value) }]);
    setLabel("");
    setValue("");
  };

  return (
    <div className={styles.chartWindow}>
      <HighChartsLine
        data={data.map((d) => ({ time: d.label, count: d.value }))}
        xaxis="time"
        yaxis="count"
        chartTitle={"Sample Chart"}
        height={300}
        marginTop={10}
      />
      <div className={styles.inputArea}>
        <Input
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <Input
          placeholder="Value"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button onClick={addPoint}>Add</Button>
      </div>
    </div>
  );
}
